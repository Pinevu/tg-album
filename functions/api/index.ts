import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  TG_BOT_TOKEN?: string
  TG_CHAT_ID?: string
  JWT_SECRET?: string
}

type AlbumRow = { id: number; name: string; parent_id: number | null; visibility?: string }
type TreeNode = AlbumRow & { children: TreeNode[] }

const app = new Hono<{ Bindings: Bindings }>()
const JWT_SECRET_FALLBACK = 'tg-album-fallback-secret'
const getJwtSecret = (c: any) => c.env.JWT_SECRET || JWT_SECRET_FALLBACK
const auth = jwt({ secret: (c) => getJwtSecret(c), alg: 'HS256' })

const buildTree = (rows: AlbumRow[]): TreeNode[] => {
  const map = new Map<number, TreeNode>()
  rows.forEach(r => map.set(r.id, { ...r, children: [] }))
  const roots: TreeNode[] = []
  rows.forEach(r => {
    const node = map.get(r.id)!
    if (r.parent_id && map.has(r.parent_id)) map.get(r.parent_id)!.children.push(node)
    else roots.push(node)
  })
  return roots
}

const getActivePool = async (c: any) => {
  const pool = await c.env.DB.prepare('SELECT * FROM tg_pools WHERE enabled = 1 ORDER BY id DESC LIMIT 1').first<any>()
  if (pool) return { bot_token: pool.bot_token, chat_id: pool.chat_id, tg_pool_id: pool.id }
  return { bot_token: c.env.TG_BOT_TOKEN, chat_id: c.env.TG_CHAT_ID, tg_pool_id: null }
}

const ensureDefaultAlbum = async (c: any) => {
  const row = await c.env.DB.prepare("SELECT id FROM albums WHERE name = '未分类' LIMIT 1").first<any>()
  if (row?.id) return row.id
  const created = await c.env.DB.prepare("INSERT INTO albums (name, parent_id, cover_photo_id, visibility) VALUES ('未分类', NULL, NULL, 'private')").run()
  return created.meta.last_row_id
}

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/public/albums', async (c) => {
  const res = await c.env.DB.prepare("SELECT * FROM albums WHERE visibility = 'public' ORDER BY id ASC").all()
  return c.json({ results: res.results || [] })
})

app.get('/api/public/photos', async (c) => {
  const album_id = c.req.query('album_id')
  const p: any[] = []
  let sql = `SELECT p.* FROM photos p JOIN albums a ON p.album_id = a.id WHERE p.deleted_at IS NULL AND a.visibility = 'public'`
  if (album_id) { sql += ' AND p.album_id = ?'; p.push(album_id) }
  sql += ' ORDER BY p.uploaded_at DESC LIMIT 200'
  const res = await c.env.DB.prepare(sql).bind(...p).all()
  return c.json({ results: res.results || [] })
})

app.post('/api/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<any>()
    if (!user || user.password_hash !== password) return c.json({ error: 'Invalid credentials' }, 401)
    const token = await sign({ uid: user.id, username }, getJwtSecret(c), 'HS256')
    return c.json({ token })
  } catch {
    return c.json({ error: 'Login failed' }, 500)
  }
})

app.get('/api/stats', auth, async (c) => {
  const totalPhotos = await c.env.DB.prepare('SELECT COUNT(*) as c FROM photos WHERE deleted_at IS NULL').first<any>()
  const totalAlbums = await c.env.DB.prepare('SELECT COUNT(*) as c FROM albums').first<any>()
  const totalDeleted = await c.env.DB.prepare('SELECT COUNT(*) as c FROM photos WHERE deleted_at IS NOT NULL').first<any>()
  const totalPools = await c.env.DB.prepare('SELECT COUNT(*) as c FROM tg_pools').first<any>()
  return c.json({ totalPhotos: totalPhotos?.c || 0, totalAlbums: totalAlbums?.c || 0, totalDeleted: totalDeleted?.c || 0, totalPools: totalPools?.c || 0 })
})

app.get('/api/tg-pools', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT id,name,chat_id,enabled,created_at FROM tg_pools ORDER BY id DESC').all()
  return c.json({ results: res.results || [] })
})

app.post('/api/tg-pools', auth, async (c) => {
  const { name, bot_token, chat_id, enabled } = await c.req.json()
  if (enabled) await c.env.DB.prepare('UPDATE tg_pools SET enabled = 0').run()
  await c.env.DB.prepare('INSERT INTO tg_pools (name, bot_token, chat_id, enabled) VALUES (?, ?, ?, ?)').bind(name, bot_token, chat_id, enabled ? 1 : 0).run()
  return c.json({ success: true })
})

app.put('/api/tg-pools/:id', auth, async (c) => {
  const id = c.req.param('id')
  const { name, bot_token, chat_id, enabled } = await c.req.json()
  if (enabled) await c.env.DB.prepare('UPDATE tg_pools SET enabled = 0').run()
  await c.env.DB.prepare('UPDATE tg_pools SET name = ?, bot_token = ?, chat_id = ?, enabled = ? WHERE id = ?').bind(name, bot_token, chat_id, enabled ? 1 : 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/tg-pools/:id', auth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM tg_pools WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

app.get('/api/albums', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM albums ORDER BY id ASC').all()
  return c.json({ results: res.results || [] })
})

app.get('/api/albums/tree', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT id,name,parent_id,visibility FROM albums ORDER BY id ASC').all<AlbumRow>()
  return c.json({ results: buildTree(res.results || []) })
})

app.post('/api/albums', auth, async (c) => {
  const { name, parent_id, visibility } = await c.req.json()
  await c.env.DB.prepare('INSERT INTO albums (name,parent_id,cover_photo_id,visibility) VALUES (?,?,NULL,?)').bind(name, parent_id ?? null, visibility || 'private').run()
  return c.json({ success: true })
})

app.get('/api/tags', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM tags ORDER BY name ASC').all()
  return c.json({ results: res.results || [] })
})

app.get('/api/photos/file/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT tg_file_id, tg_pool_id FROM photos WHERE id = ?').bind(id).first<any>()
  if (!row) return c.json({ error: 'Not found' }, 404)
  let botToken = c.env.TG_BOT_TOKEN
  if (row.tg_pool_id) {
    const pool = await c.env.DB.prepare('SELECT bot_token FROM tg_pools WHERE id = ?').bind(row.tg_pool_id).first<any>()
    if (pool?.bot_token) botToken = pool.bot_token
  }
  if (!botToken) return c.json({ error: 'TG token not configured' }, 500)
  const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${row.tg_file_id}`)
  const fileJson = await fileRes.json<any>()
  if (!fileJson.ok) return c.json({ error: 'Telegram getFile failed', detail: fileJson }, 500)
  const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileJson.result.file_path}`)
  return new Response(imgRes.body, { headers: { 'content-type': imgRes.headers.get('content-type') || 'image/jpeg', 'cache-control': 'public, max-age=86400' } })
})

app.post('/api/upload', auth, async (c) => {
  try {
    const form = await c.req.formData()
    const file = form.get('file') as File | null
    if (!file) return c.json({ error: 'No file provided' }, 400)
    const pool = await getActivePool(c)
    if (!pool.bot_token || !pool.chat_id) return c.json({ error: '未配置 TG 存储池' }, 500)
    const defaultAlbumId = await ensureDefaultAlbum(c)
    const albumId = form.get('album_id')?.toString() || String(defaultAlbumId)
    const remark = form.get('remark')?.toString() || null
    const original = form.get('original_filename')?.toString() || file.name
    const dominant = form.get('dominant_color_hex')?.toString() || null
    const exifJson = form.get('exif_json')?.toString() || null
    const tgRes = await fetch(`https://api.telegram.org/bot${pool.bot_token}/sendPhoto`, { method: 'POST', body: (() => { const f = new FormData(); f.append('chat_id', pool.chat_id!); f.append('photo', file); return f })() })
    const tg = await tgRes.json<any>()
    if (!tg.ok) return c.json({ error: 'Telegram upload failed', detail: tg }, 500)
    const photo = tg.result.photo.at(-1)
    const now = Math.floor(Date.now() / 1000)
    const tx = c.env.DB.transaction(async (tx) => {
      const ins = await tx.prepare('INSERT INTO photos (album_id,tg_pool_id,tg_file_id,tg_file_unique_id,original_filename,remark,width,height,file_size,dominant_color_hex,uploaded_at,tg_message_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(albumId, pool.tg_pool_id, photo.file_id, photo.file_unique_id, original, remark, photo.width, photo.height, photo.file_size, dominant, now, tg.result.message_id || null).run()
      if (exifJson) await tx.prepare('INSERT OR REPLACE INTO photo_metadata (photo_id,raw_exif_json) VALUES (?,?)').bind(ins.meta.last_row_id, exifJson).run()
    })
    return c.json({ success: true, pooled: true, album_id: albumId })
  } catch {
    return c.json({ error: 'Upload failed' }, 500)
  }
})

app.get('/api/photos/search', auth, async (c) => {
  const { album_id, tag, date_start, date_end, keyword, page='1', page_size='30' } = c.req.query()
  const p: any[] = []
  let sql = `SELECT p.*, m.camera_model, m.aperture, m.shutter_speed, m.iso, m.focal_length FROM photos p LEFT JOIN photo_metadata m ON p.id=m.photo_id LEFT JOIN photo_tags pt ON p.id=pt.photo_id LEFT JOIN tags t ON pt.tag_id=t.id WHERE p.deleted_at IS NULL`
  if (album_id) { sql += ' AND p.album_id = ?'; p.push(album_id) }
  if (tag) { sql += ' AND t.name = ?'; p.push(tag) }
  if (keyword) { sql += ' AND (p.original_filename LIKE ? OR p.remark LIKE ?)'; p.push(`%${keyword}%`, `%${keyword}%`) }
  if (date_start) { sql += ' AND p.uploaded_at >= ?'; p.push(date_start) }
  if (date_end) { sql += ' AND p.uploaded_at <= ?'; p.push(date_end) }
  sql += ' ORDER BY p.uploaded_at DESC LIMIT ? OFFSET ?'
  p.push(Number(page_size), (Number(page)-1)*Number(page_size))
  const res = await c.env.DB.prepare(sql).bind(...p).all()
  return c.json({ results: res.results || [] })
})

app.get('/api/photos/:id', auth, async (c) => {
  const id = c.req.param('id')
  const res = await c.env.DB.prepare('SELECT p.*, m.camera_make, m.camera_model, m.lens, m.aperture, m.shutter_speed, m.iso, m.focal_length, m.gps_lat, m.gps_lng, m.taken_at, m.raw_exif_json FROM photos p LEFT JOIN photo_metadata m ON p.id = m.photo_id WHERE p.id = ?').bind(id).first<any>()
  if (!res) return c.json({ error: 'Not found' }, 404)
  return c.json(res)
})

app.put('/api/photos/:id/remark', auth, async (c) => {
  const id = c.req.param('id')
  const { remark } = await c.req.json()
  await c.env.DB.prepare('UPDATE photos SET remark = ? WHERE id = ?').bind(remark, id).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-move', auth, async (c) => {
  const { ids, target_album_id } = await c.req.json()
  if (!ids?.length) return c.json({ success: true })
  await c.env.DB.prepare(`UPDATE photos SET album_id = ? WHERE id IN (${ids.map(() => '?').join(',')})`).bind(target_album_id, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-delete', auth, async (c) => {
  const { ids } = await c.req.json()
  if (!ids?.length) return c.json({ success: true })
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).bind(now, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-tag', auth, async (c) => {
  const { ids, tags } = await c.req.json()
  if (!ids?.length || !tags?.length) return c.json({ success: true })
  for (const name of tags) await c.env.DB.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').bind(name).run()
  const ts = await c.env.DB.prepare(`SELECT id,name FROM tags WHERE name IN (${tags.map(() => '?').join(',')})`).bind(...tags).all<any>()
  for (const t of ts.results || []) for (const id of ids) await c.env.DB.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)').bind(id, t.id).run()
  return c.json({ success: true })
})

app.get('/api/admin/recycle-bin', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM photos WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all()
  return c.json({ results: res.results || [] })
})

app.post('/api/admin/recycle-bin/restore', auth, async (c) => {
  const { ids } = await c.req.json()
  if (!ids?.length) return c.json({ success: true })
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = NULL WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).run()
  return c.json({ success: true })
})

app.post('/api/admin/recycle-bin/delete', auth, async (c) => {
  const { ids } = await c.req.json()
  if (!ids?.length) return c.json({ success: true })
  await c.env.DB.prepare(`DELETE FROM photos WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).run()
  return c.json({ success: true })
})

export default app
