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
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

app.post('/api/login', async (c) => {
  const { username, password } = await c.req.json()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?')
    .bind(username).first()

  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  if (password !== user.password_hash) return c.json({ error: 'Invalid credentials' }, 401)

  const token = await sign({ uid: user.id, username }, c.env.JWT_SECRET)
  return c.json({ token })
})

app.post('/api/upload', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const form = await c.req.formData()
  const file = form.get('file') as File
  const albumId = form.get('album_id')?.toString()
  const originalFilename = (form.get('original_filename') as string) || file?.name || null
  const remark = (form.get('remark') as string) || null
  const dominantColor = (form.get('dominant_color_hex') as string) || null

  const camera_make = form.get('camera_make') as string | null
  const camera_model = form.get('camera_model') as string | null
  const lens = form.get('lens') as string | null
  const aperture = form.get('aperture') as string | null
  const shutter_speed = form.get('shutter_speed') as string | null
  const iso = form.get('iso') ? Number(form.get('iso')) : null
  const focal_length = form.get('focal_length') as string | null
  const gps_lat = form.get('gps_lat') ? Number(form.get('gps_lat')) : null
  const gps_lng = form.get('gps_lng') ? Number(form.get('gps_lng')) : null
  const taken_at = form.get('taken_at') ? Number(form.get('taken_at')) : null
  const raw_exif_json = form.get('exif_json') as string | null

  if (!file) return c.json({ error: 'No file provided' }, 400)

  const tgRes = await fetch(`https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    body: (() => {
      const f = new FormData()
      f.append('chat_id', c.env.TG_CHAT_ID)
      f.append('photo', file)
      return f
    })()
  })

  const tgJson = await tgRes.json()
  if (!tgJson.ok) return c.json({ error: 'Telegram upload failed', detail: tgJson }, 500)

  const photo = tgJson.result.photo.at(-1)
  const now = Math.floor(Date.now() / 1000)

  const insertPhoto = `
    INSERT INTO photos (album_id, tg_file_id, tg_file_unique_id, original_filename, remark, width, height, file_size, dominant_color_hex, uploaded_at, tg_message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const insertMeta = `
    INSERT OR REPLACE INTO photo_metadata (
      photo_id, camera_make, camera_model, lens, aperture, shutter_speed, iso, focal_length, gps_lat, gps_lng, taken_at, raw_exif_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const tx = c.env.DB.transaction(async (tx) => {
    const res = await tx.prepare(insertPhoto).bind(
      albumId ?? null,
      photo.file_id,
      photo.file_unique_id,
      originalFilename,
      remark,
      photo.width,
      photo.height,
      photo.file_size,
      dominantColor,
      now,
      tgJson.result.message_id || null
    ).run()

    const photoId = res.meta.last_row_id
    if (raw_exif_json || camera_make || camera_model || lens) {
      await tx.prepare(insertMeta).bind(
        photoId,
        camera_make,
        camera_model,
        lens,
        aperture,
        shutter_speed,
        iso,
        focal_length,
        gps_lat,
        gps_lng,
        taken_at,
        raw_exif_json
      ).run()
    }
  })

  await tx
  return c.json({ success: true })
})

app.get('/api/tags', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const results = await c.env.DB.prepare('SELECT * FROM tags ORDER BY name ASC').all()
  return c.json(results)
})

app.get('/api/photos/:id', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(`
    SELECT p.*, m.*
    FROM photos p
    LEFT JOIN photo_metadata m ON p.id = m.photo_id
    WHERE p.id = ?
  `).bind(id).first()

  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

app.put('/api/photos/:id/remark', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const id = c.req.param('id')
  const { remark } = await c.req.json()
  await c.env.DB.prepare('UPDATE photos SET remark = ? WHERE id = ?').bind(remark, id).run()
  return c.json({ success: true })
})

app.get('/api/albums', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const results = await c.env.DB.prepare('SELECT * FROM albums ORDER BY id ASC').all()
  return c.json(results)
})

app.get('/api/albums/tree', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const results = await c.env.DB.prepare('SELECT id, name, parent_id FROM albums ORDER BY id ASC').all()
  const tree = buildTree((results.results || []) as AlbumRow[])
  return c.json({ results: tree })
})

app.post('/api/albums', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { name, parent_id } = await c.req.json()
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(
    'INSERT INTO albums (name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).bind(name, parent_id ?? null, now, now).run()
  return c.json({ success: true })
})

app.put('/api/albums/:id', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const id = c.req.param('id')
  const { name, parent_id } = await c.req.json()
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(
    'UPDATE albums SET name = ?, parent_id = ?, updated_at = ? WHERE id = ?'
  ).bind(name, parent_id ?? null, now, id).run()
  return c.json({ success: true })
})

app.delete('/api/albums/:id', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

app.get('/api/photos/search', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { album_id, tag, date_start, date_end, keyword, page = '1', page_size = '30' } = c.req.query()
  const params: any[] = []
  let sql = `
    SELECT p.*, m.camera_model, m.aperture
    FROM photos p
    LEFT JOIN photo_tags pt ON p.id = pt.photo_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    LEFT JOIN photo_metadata m ON p.id = m.photo_id
    WHERE p.deleted_at IS NULL
  `

  if (album_id) { sql += ` AND p.album_id = ?`; params.push(album_id) }
  if (tag) { sql += ` AND t.name = ?`; params.push(tag) }
  if (keyword) { sql += ` AND p.original_filename LIKE ?`; params.push(`%${keyword}%`) }
  if (date_start) { sql += ` AND p.uploaded_at >= ?`; params.push(date_start) }
  if (date_end) { sql += ` AND p.uploaded_at <= ?`; params.push(date_end) }

  sql += ` ORDER BY p.uploaded_at DESC LIMIT ? OFFSET ?`
  params.push(Number(page_size), (Number(page) - 1) * Number(page_size))

  const results = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

app.get('/api/photos/file/:id', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare('SELECT tg_file_id FROM photos WHERE id = ?')
    .bind(id).first()

  if (!row) return c.json({ error: 'Not found' }, 404)

  const fileRes = await fetch(`https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/getFile?file_id=${row.tg_file_id}`)
  const fileJson = await fileRes.json()
  if (!fileJson.ok) return c.json({ error: 'Telegram getFile failed', detail: fileJson }, 500)

  const filePath = fileJson.result.file_path
  const fileUrl = `https://api.telegram.org/file/bot${c.env.TG_BOT_TOKEN}/${filePath}`
  const imgRes = await fetch(fileUrl)

  return new Response(imgRes.body, {
    headers: {
      'content-type': imgRes.headers.get('content-type') || 'image/jpeg',
      'cache-control': 'public, max-age=86400'
    }
  })
})

app.post('/api/photos/batch-move', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { ids, target_album_id } = await c.req.json()
  const placeholders = ids.map(() => '?').join(',')
  const sql = `UPDATE photos SET album_id = ? WHERE id IN (${placeholders})`
  await c.env.DB.prepare(sql).bind(target_album_id, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-delete', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { ids } = await c.req.json()
  const placeholders = ids.map(() => '?').join(',')
  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = ? WHERE id IN (${placeholders})`).bind(now, ...ids).run()
  return c.json({ success: true })
})

app.post('/api/photos/batch-tag', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { ids, tags } = await c.req.json()
  for (const name of tags) {
    await c.env.DB.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').bind(name).run()
  }
  const tagRows = await c.env.DB.prepare(`SELECT * FROM tags WHERE name IN (${tags.map(() => '?').join(',')})`).bind(...tags).all()
  for (const t of (tagRows.results || []) as any[]) {
    for (const pid of ids) {
      await c.env.DB.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)').bind(pid, t.id).run()
    }
  }
  return c.json({ success: true })
})

app.get('/api/admin/recycle-bin', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT * FROM photos WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  ).all()
  return c.json(results)
})

app.post('/api/admin/recycle-bin/restore', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { ids } = await c.req.json()
  const placeholders = ids.map(() => '?').join(',')
  await c.env.DB.prepare(`UPDATE photos SET deleted_at = NULL WHERE id IN (${placeholders})`).bind(...ids).run()
  return c.json({ success: true })
})

app.post('/api/admin/recycle-bin/delete', jwt({ secret: (c) => c.env.JWT_SECRET }), async (c) => {
  const { ids } = await c.req.json()

  const rows = await c.env.DB.prepare(
    `SELECT id, tg_message_id FROM photos WHERE id IN (${ids.map(() => '?').join(',')})`
  ).bind(...ids).all()

  for (const r of (rows.results || []) as any[]) {
    if (r.tg_message_id) {
      await fetch(`https://api.telegram.org/bot${c.env.TG_BOT_TOKEN}/deleteMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: c.env.TG_CHAT_ID, message_id: r.tg_message_id })
      })
    }
  }

  await c.env.DB.prepare(`DELETE FROM photos WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).run()
  return c.json({ success: true })
})

app.post('/api/tg/webhook', async (c) => {
  const update = await c.req.json()
  const photo = update.message?.photo?.at(-1)
  if (!photo) return c.json({ ok: true })

  const now = Math.floor(Date.now() / 1000)
  await c.env.DB.prepare(`
    INSERT INTO photos (album_id, tg_file_id, tg_file_unique_id, width, height, file_size, uploaded_at, tg_message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    1,
    photo.file_id,
    photo.file_unique_id,
    photo.width,
    photo.height,
    photo.file_size,
    now,
    update.message?.message_id || null
  ).run()

  return c.json({ ok: true })
})

export default app
