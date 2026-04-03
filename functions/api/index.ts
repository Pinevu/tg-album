import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  TG_BOT_TOKEN: string
  TG_CHAT_ID: string
  JWT_SECRET: string
}

type AlbumRow = { id: number; name: string; parent_id: number | null }
type TreeNode = AlbumRow & { children: TreeNode[] }

const app = new Hono<{ Bindings: Bindings }>()

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

const auth = jwt({ secret: (c) => c.env.JWT_SECRET, alg: 'HS256' })

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<any>()
  if (!user || user.password_hash !== password) return c.json({ error: 'Invalid credentials' }, 401)
  const token = await sign({ uid: user.id, username }, c.env.JWT_SECRET, 'HS256')
  return c.json({ token })
})

app.get('/api/albums/tree', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT id,name,parent_id FROM albums ORDER BY id ASC').all<AlbumRow>()
  return c.json({ results: buildTree(res.results || []) })
})

app.post('/api/albums', auth, async (c) => {
  const { name, parent_id } = await c.req.json()
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare('INSERT INTO albums (name,parent_id,created_at,updated_at) VALUES (?,?,?,?)').bind(name, parent_id ?? null, now, now).run()
  return c.json({ success: true })
})

app.get('/api/tags', auth, async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM tags ORDER BY name ASC').all()
  return c.json(res)
})

app.post('/api/upload', auth, async (c) => {
  const form = await c.req.formData()
  const file = form.get('file') as File | null
  if (!file) return c.json({ error: 'No file provided' }, 400)
  const albumId = form.get('album_id')?.toString() || null
  const remark = form.get('remark')?.toString() || null
  const original = form.get('original_filename')?.toString() || file.name
  const dominant = form.get('dominant_color_hex')?.toString() || null
  const exifJson = form.get('exif_json')?.toString() || null
  const tgRes = await fetch(`https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: (() => { const f = new FormData(); f.append('chat_id', c.env.TG_CHAT_ID); f.append('photo', file); return f })() })
  const tg = await tgRes.json<any>()
  if (!tg.ok) return c.json({ error: 'Telegram upload failed', detail: tg }, 500)
  const photo = tg.result.photo.at(-1)
  const now = Math.floor(Date.now() / 1000)
  const tx = c.env.DB.transaction(async (tx) => {
    const ins = await tx.prepare('INSERT INTO photos (album_id,tg_file_id,tg_file_unique_id,original_filename,remark,width,height,file_size,dominant_color_hex,uploaded_at,tg_message_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(albumId, photo.file_id, photo.file_unique_id, original, remark, photo.width, photo.height, photo.file_size, dominant, now, tg.result.message_id || null).run()
    if (exifJson) await tx.prepare('INSERT OR REPLACE INTO photo_metadata (photo_id,raw_exif_json) VALUES (?,?)').bind(ins.meta.last_row_id, exifJson).run()
  })
  await tx
  return c.json({ success: true })
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
  const res = await c.env.DB.prepare('SELECT p.*, m.* FROM photos p LEFT JOIN photo_metadata m ON p.id=m.photo_id WHERE p.id = ?').bind(id).first()
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
  await c.env.DB.prepare(`UPDATE photos SET album_id = ? WHERE id IN (${ids.map(() => '?').join(',')})`).bind(target_album_id, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-delete', auth, async (c) => {
  const { ids } = await c.req.json()
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = ? WHERE id IN (${ids.map(() => '?').join(',')})`).bind(now, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-tag', auth, async (c) => {
  const { ids, tags } = await c.req.json()
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
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = NULL WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).run()
  return c.json({ success: true })
})

app.post('/api/admin/recycle-bin/delete', auth, async (c) => {
  const { ids } = await c.req.json()
  await c.env.DB.prepare(`DELETE FROM photos WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).run()
  return c.json({ success: true })
})

export default app
