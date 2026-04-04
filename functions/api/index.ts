import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  TG_BOT_TOKEN?: string
  TG_CHAT_ID?: string
  JWT_SECRET?: string
}

type AlbumRow = { id: number; name: string; parent_id: number | null; visibility?: string; cover_photo_id?: number | null }
type TreeNode = AlbumRow & { children: TreeNode[] }

const app = new Hono<{ Bindings: Bindings }>()
const JWT_SECRET_FALLBACK = 'tg-album-fallback-secret'
const getJwtSecret = (c: any) => c.env.JWT_SECRET || JWT_SECRET_FALLBACK
const getOrigin = (c: any) => new URL(c.req.url).origin

const auth = async (c: any, next: any) => {
  try {
    const authHeader = c.req.header('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return c.json({ error: 'Unauthorized' }, 401)
    await verify(token, getJwtSecret(c), 'HS256')
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

const tableHasColumn = async (c: any, table: string, col: string) => {
  const res = await c.env.DB.prepare(`PRAGMA table_info(${table})`).all<any>()
  return (res.results || []).some((r: any) => r.name === col)
}

const ensureBaseSchema = async (c: any) => {
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL)`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS albums (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, parent_id INTEGER)`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, album_id INTEGER, tg_file_id TEXT NOT NULL, tg_file_unique_id TEXT NOT NULL UNIQUE, original_filename TEXT, width INTEGER, height INTEGER, file_size INTEGER, dominant_color_hex TEXT, uploaded_at INTEGER NOT NULL, deleted_at INTEGER, tg_message_id INTEGER)`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS photo_tags (photo_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (photo_id, tag_id))`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS photo_metadata (photo_id INTEGER PRIMARY KEY, camera_make TEXT, camera_model TEXT, lens TEXT, aperture TEXT, shutter_speed TEXT, iso INTEGER, focal_length TEXT, gps_lat REAL, gps_lng REAL, taken_at INTEGER, raw_exif_json TEXT)`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS tg_pools (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, bot_token TEXT NOT NULL, chat_id TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run()
  await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).run()

  if (!(await tableHasColumn(c, 'albums', 'visibility'))) {
    try { await c.env.DB.prepare(`ALTER TABLE albums ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'`).run() } catch {}
  }
  if (!(await tableHasColumn(c, 'albums', 'cover_photo_id'))) {
    try { await c.env.DB.prepare(`ALTER TABLE albums ADD COLUMN cover_photo_id INTEGER`).run() } catch {}
  }
  if (!(await tableHasColumn(c, 'photos', 'remark'))) {
    try { await c.env.DB.prepare(`ALTER TABLE photos ADD COLUMN remark TEXT`).run() } catch {}
  }
  if (!(await tableHasColumn(c, 'photos', 'tg_pool_id'))) {
    try { await c.env.DB.prepare(`ALTER TABLE photos ADD COLUMN tg_pool_id INTEGER`).run() } catch {}
  }

  const defaultAlbum = await c.env.DB.prepare(`SELECT id FROM albums WHERE name = '未分类' LIMIT 1`).first<any>()
  if (!defaultAlbum) {
    await c.env.DB.prepare(`INSERT INTO albums (name, parent_id, visibility, cover_photo_id) VALUES ('未分类', NULL, 'private', NULL)`).run()
  }
}

app.use('*', async (c, next) => {
  await ensureBaseSchema(c)
  await next()
})

const buildTree = (rows: AlbumRow[]): TreeNode[] => {
  const map = new Map<number, TreeNode>()
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }))
  const roots: TreeNode[] = []
  rows.forEach((r) => {
    const node = map.get(r.id)!
    if (r.parent_id && map.has(r.parent_id)) map.get(r.parent_id)!.children.push(node)
    else roots.push(node)
  })
  return roots
}

const flattenTree = (nodes: any[]): any[] => nodes.flatMap((n) => [n, ...(n.children ? flattenTree(n.children) : [])])

const getActivePool = async (c: any) => {
  const pool = await c.env.DB.prepare(`SELECT * FROM tg_pools WHERE enabled = 1 ORDER BY id DESC LIMIT 1`).first<any>()
  if (pool) return { bot_token: pool.bot_token, chat_id: pool.chat_id, tg_pool_id: pool.id }
  return { bot_token: c.env.TG_BOT_TOKEN, chat_id: c.env.TG_CHAT_ID, tg_pool_id: null }
}

const ensureDefaultAlbum = async (c: any) => {
  const row = await c.env.DB.prepare(`SELECT id FROM albums WHERE name = '未分类' LIMIT 1`).first<any>()
  return row?.id
}

app.get('/api/health', (c) => c.json({ ok: true }))

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

app.get('/api/public/albums', async (c) => {
  const res = await c.env.DB.prepare(`SELECT id, name, visibility, cover_photo_id FROM albums WHERE visibility = 'public' ORDER BY id ASC`).all<any>()
  const albums = res.results || []
  const albumIds = albums.map(a => a.id)
  // 获取每个相册的照片数量和封面照片信息
  if (albumIds.length > 0) {
    const placeholders = albumIds.map(() => '?').join(',')
    const countRes = await c.env.DB.prepare(`SELECT album_id, COUNT(*) as count FROM photos WHERE album_id IN (${placeholders}) AND deleted_at IS NULL GROUP BY album_id`).bind(...albumIds).all<any>()
    const countMap = new Map((countRes.results || []).map((r: any) => [r.album_id, r.count]))

    const coverRes = await c.env.DB.prepare(`SELECT album_id, file_id, width, height FROM photos WHERE album_id IN (${placeholders}) AND deleted_at IS NULL AND id IN (SELECT cover_photo_id FROM albums WHERE album_id IN (${placeholders}))`).bind(...albumIds, ...albumIds).all<any>()
    const coverMap = new Map((coverRes.results || []).map((r: any) => [r.album_id, r]))

    albums.forEach((a: any) => {
      a.photo_count = countMap.get(a.id) || 0
      if (a.cover_photo_id) {
        a.cover_photo = coverMap.get(a.id)
      }
    })
  }
  return c.json({ results: albums })
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

app.get('/api/stats', auth, async (c) => {
  const totalPhotos = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM photos WHERE deleted_at IS NULL`).first<any>()
  const totalAlbums = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM albums`).first<any>()
  const totalDeleted = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM photos WHERE deleted_at IS NOT NULL`).first<any>()
  const totalPools = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM tg_pools`).first<any>()
  return c.json({ totalPhotos: totalPhotos?.c || 0, totalAlbums: totalAlbums?.c || 0, totalDeleted: totalDeleted?.c || 0, totalPools: totalPools?.c || 0 })
})

app.get('/api/tg-pools', auth, async (c) => {
  const res = await c.env.DB.prepare(`SELECT id, name, chat_id, enabled, created_at FROM tg_pools ORDER BY id DESC`).all()
  return c.json({ results: res.results || [] })
})

app.post('/api/tg-pools', auth, async (c) => {
  const { name, bot_token, chat_id, enabled } = await c.req.json()
  if (enabled) await c.env.DB.prepare(`UPDATE tg_pools SET enabled = 0`).run()
  await c.env.DB.prepare(`INSERT INTO tg_pools (name, bot_token, chat_id, enabled) VALUES (?, ?, ?, ?)`).bind(name, bot_token, chat_id, enabled ? 1 : 0).run()
  return c.json({ success: true })
})

app.post('/api/tg-pools/test', auth, async (c) => {
  try {
    const { bot_token } = await c.req.json()
    if (!bot_token) return c.json({ ok: false, error: '缺少 bot_token' }, 400)
    const res = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`)
    const data = await res.json<any>()
    return c.json({ ok: !!data.ok, data })
  } catch {
    return c.json({ ok: false }, 500)
  }
})

app.put('/api/tg-pools/:id', auth, async (c) => {
  const id = c.req.param('id')
  const { name, bot_token, chat_id, enabled } = await c.req.json()
  if (enabled) await c.env.DB.prepare(`UPDATE tg_pools SET enabled = 0`).run()
  await c.env.DB.prepare(`UPDATE tg_pools SET name = ?, bot_token = ?, chat_id = ?, enabled = ? WHERE id = ?`).bind(name, bot_token, chat_id, enabled ? 1 : 0, id).run()
  return c.json({ success: true })
})

app.delete('/api/tg-pools/:id', auth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM tg_pools WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

app.get('/api/tg/webhook-url', auth, async (c) => {
  const url = `${getOrigin(c)}/api/tg/webhook/<poolId>`
  return c.json({ webhook_url: url, set_webhook_command: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=${encodeURIComponent(url)}` })
})

app.post('/api/tg/webhook/:poolId', async (c) => {
  try {
    const poolId = c.req.param('poolId')
    const update = await c.req.json<any>()
    const photo = update.message?.photo?.at(-1)
    if (!photo) return c.json({ ok: true })
    const defaultAlbumId = await ensureDefaultAlbum(c)
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(`INSERT OR IGNORE INTO photos (album_id, tg_pool_id, tg_file_id, tg_file_unique_id, width, height, file_size, uploaded_at, tg_message_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(defaultAlbumId, poolId, photo.file_id, photo.file_unique_id, photo.width, photo.height, photo.file_size, now, update.message?.message_id || null).run()
    return c.json({ ok: true })
  } catch {
    return c.json({ ok: false }, 500)
  }
})

app.get('/api/albums', auth, async (c) => {
  const res = await c.env.DB.prepare(`SELECT * FROM albums ORDER BY id ASC`).all()
  return c.json({ results: res.results || [] })
})

app.get('/api/albums/tree', auth, async (c) => {
  const res = await c.env.DB.prepare(`SELECT id, name, parent_id, visibility, cover_photo_id FROM albums ORDER BY id ASC`).all<AlbumRow>()
  return c.json({ results: buildTree(res.results || []) })
})

app.post('/api/albums', auth, async (c) => {
  const { name, parent_id, visibility } = await c.req.json()
  await c.env.DB.prepare(`INSERT INTO albums (name, parent_id, visibility) VALUES (?, ?, ?)`).bind(name, parent_id ?? null, visibility || 'private').run()
  return c.json({ success: true })
})

app.put('/api/albums/:id', auth, async (c) => {
  const id = c.req.param('id')
  const { name, visibility } = await c.req.json()
  await c.env.DB.prepare(`UPDATE albums SET name = ?, visibility = ? WHERE id = ?`).bind(name, visibility || 'private', id).run()
  return c.json({ success: true })
})

app.put('/api/albums/:id/cover', auth, async (c) => {
  const id = c.req.param('id')
  const { cover_photo_id } = await c.req.json()
  await c.env.DB.prepare(`UPDATE albums SET cover_photo_id = ? WHERE id = ?`).bind(cover_photo_id, id).run()
  return c.json({ success: true })
})

app.delete('/api/albums/:id', auth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM albums WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

app.get('/api/tags', auth, async (c) => {
  const res = await c.env.DB.prepare(`SELECT * FROM tags ORDER BY name ASC`).all()
  return c.json({ results: res.results || [] })
})

app.get('/api/photos/file/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(`SELECT tg_file_id, tg_pool_id FROM photos WHERE id = ?`).bind(id).first<any>()
  if (!row) return c.json({ error: 'Not found' }, 404)
  let botToken = c.env.TG_BOT_TOKEN
  if (row.tg_pool_id) {
    const pool = await c.env.DB.prepare(`SELECT bot_token FROM tg_pools WHERE id = ?`).bind(row.tg_pool_id).first<any>()
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
    const tgRes = await fetch(`https://api.telegram.org/bot${pool.bot_token}/sendPhoto`, {
      method: 'POST',
      body: (() => {
        const f = new FormData()
        f.append('chat_id', pool.chat_id!)
        f.append('photo', file)
        return f
      })()
    })
    const tg = await tgRes.json<any>()
    if (!tg.ok) return c.json({ error: 'Telegram upload failed', detail: tg }, 500)
    const photo = tg.result.photo.at(-1)
    const now = Math.floor(Date.now() / 1000)
    const ins = await c.env.DB.prepare(`INSERT INTO photos (album_id, tg_pool_id, tg_file_id, tg_file_unique_id, original_filename, remark, width, height, file_size, dominant_color_hex, uploaded_at, tg_message_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(albumId, pool.tg_pool_id, photo.file_id, photo.file_unique_id, original, remark, photo.width, photo.height, photo.file_size, dominant, now, tg.result.message_id || null).run()
    const photoId = ins.meta.last_row_id
    if (exifJson) {
      await c.env.DB.prepare(`INSERT OR REPLACE INTO photo_metadata (photo_id, raw_exif_json) VALUES (?, ?)`).bind(photoId, exifJson).run()
    }
    return c.json({ success: true, pooled: true, album_id: albumId, id: photoId, direct_url: `${getOrigin(c)}/api/photos/file/${photoId}` })
  } catch (e: any) {
    return c.json({ error: e?.message || 'Upload failed' }, 500)
  }
})

app.get('/api/photos/search', auth, async (c) => {
  const { album_id, tag, date_start, date_end, keyword, page='1', page_size='30' } = c.req.query()
  const p: any[] = []
  let sql = `SELECT p.*, a.name AS album_name, GROUP_CONCAT(DISTINCT t.name) AS tags, m.camera_model, m.aperture, m.shutter_speed, m.iso, m.focal_length FROM photos p LEFT JOIN albums a ON p.album_id = a.id LEFT JOIN photo_metadata m ON p.id = m.photo_id LEFT JOIN photo_tags pt ON p.id = pt.photo_id LEFT JOIN tags t ON pt.tag_id = t.id WHERE p.deleted_at IS NULL`
  if (album_id) { sql += ' AND p.album_id = ?'; p.push(album_id) }
  if (tag) { sql += ' AND t.name = ?'; p.push(tag) }
  if (keyword) { sql += ' AND (p.original_filename LIKE ? OR p.remark LIKE ?)'; p.push(`%${keyword}%`, `%${keyword}%`) }
  if (date_start) { sql += ' AND p.uploaded_at >= ?'; p.push(date_start) }
  if (date_end) { sql += ' AND p.uploaded_at <= ?'; p.push(date_end) }
  sql += ' GROUP BY p.id ORDER BY p.uploaded_at DESC LIMIT ? OFFSET ?'
  p.push(Number(page_size), (Number(page) - 1) * Number(page_size))
  const res = await c.env.DB.prepare(sql).bind(...p).all<any>()
  return c.json({ results: res.results || [] })
})

app.get('/api/photos/:id', auth, async (c) => {
  const id = c.req.param('id')
  const res = await c.env.DB.prepare(`SELECT p.*, a.name AS album_name, m.camera_make, m.camera_model, m.lens, m.aperture, m.shutter_speed, m.iso, m.focal_length, m.gps_lat, m.gps_lng, m.taken_at, m.raw_exif_json FROM photos p LEFT JOIN albums a ON p.album_id = a.id LEFT JOIN photo_metadata m ON p.id = m.photo_id WHERE p.id = ?`).bind(id).first<any>()
  if (!res) return c.json({ error: 'Not found' }, 404)
  return c.json(res)
})

app.put('/api/photos/:id/remark', auth, async (c) => {
  const id = c.req.param('id')
  const { remark } = await c.req.json()
  await c.env.DB.prepare(`UPDATE photos SET remark = ? WHERE id = ?`).bind(remark, id).run()
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
  const rows = await c.env.DB.prepare(`SELECT id, tg_pool_id, tg_message_id FROM photos WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all<any>()
  for (const row of rows.results || []) {
    if (row.tg_message_id) {
      let botToken = c.env.TG_BOT_TOKEN
      let chatId = c.env.TG_CHAT_ID
      if (row.tg_pool_id) {
        const pool = await c.env.DB.prepare(`SELECT bot_token, chat_id FROM tg_pools WHERE id = ?`).bind(row.tg_pool_id).first<any>()
        if (pool?.bot_token) botToken = pool.bot_token
        if (pool?.chat_id) chatId = pool.chat_id
      }
      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: row.tg_message_id })
        }).catch(() => null)
      }
    }
  }
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).bind(now, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-tag', auth, async (c) => {
  const { ids, tags } = await c.req.json()
  if (!ids?.length || !tags?.length) return c.json({ success: true })
  for (const name of tags) await c.env.DB.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).bind(name).run()
  const ts = await c.env.DB.prepare(`SELECT id, name FROM tags WHERE name IN (${tags.map(() => '?').join(',')})`).bind(...tags).all<any>()
  for (const t of ts.results || []) for (const id of ids) await c.env.DB.prepare(`INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)`).bind(id, t.id).run()
  return c.json({ success: true })
})

app.get('/api/admin/recycle-bin', auth, async (c) => {
  const res = await c.env.DB.prepare(`SELECT * FROM photos WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`).all()
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
