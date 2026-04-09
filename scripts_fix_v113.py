from pathlib import Path
import re

api = Path('/var/minis/workspace/tg-album/functions/api/index.ts')
text = api.read_text()

if 'const hashString = (value: string)' not in text:
    text = text.replace("const getOrigin = (c: any) => new URL(c.req.url).origin\n", "const getOrigin = (c: any) => new URL(c.req.url).origin\nconst hashString = (value: string) => {\n  let h = 0\n  for (let i = 0; i < value.length; i++) h = ((h << 5) - h) + value.charCodeAt(i)\n  return Math.abs(h).toString(36)\n}\n")

text = text.replace(
"const album = await c.env.DB.prepare(`SELECT id, name, slug, visibility FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`).bind(slug).first<any>()",
"const album = await c.env.DB.prepare(`SELECT id, name, slug, visibility, cover_photo_id, pwa_icon_url FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`).bind(slug).first<any>()",
1)

text = text.replace(
"  return c.json({ id: album.id, name: album.name, slug: album.slug, visibility: album.visibility, need_password: true })",
"  return c.json({ id: album.id, name: album.name, slug: album.slug, visibility: album.visibility, need_password: true, cover_photo_id: album.cover_photo_id || null, pwa_icon_url: album.pwa_icon_url || null, icon_version: hashString(`${album.pwa_icon_url || ''}|${album.cover_photo_id || ''}|${album.name || ''}`) })",
1)

text = text.replace(
"  const album = await c.env.DB.prepare(`SELECT id, name, slug, visibility FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`).bind(slug).first<any>()",
"  const album = await c.env.DB.prepare(`SELECT id, name, slug, visibility, cover_photo_id, pwa_icon_url FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`).bind(slug).first<any>()",
1)

text = text.replace(
"      { src: `/api/private-albums/${album.slug}/icon.svg`, sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }",
"      { src: `/api/private-albums/${album.slug}/icon.svg?v=${hashString(`${album.pwa_icon_url || ''}|${album.cover_photo_id || ''}|${album.name || ''}`)}`, sizes: '512x512', type: 'image/png', purpose: 'any' }",
1)

old_icon = '''app.get('/api/private-albums/:slug/icon.svg', async (c) => {
  const slug = c.req.param('slug')
  const album = await c.env.DB.prepare(`SELECT id, name, slug, cover_photo_id, pwa_icon_url FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`).bind(slug).first<any>()
  if (!album) return c.json({ error: 'Album not found' }, 404)

  if (album.pwa_icon_url) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><clipPath id="r"><rect width="512" height="512" rx="112" ry="112" /></clipPath><linearGradient id="overlay" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="rgba(15,23,42,0.12)"/><stop offset="100%" stop-color="rgba(37,99,235,0.08)"/></linearGradient></defs><g clip-path="url(#r)"><image href="${album.pwa_icon_url}" width="512" height="512" preserveAspectRatio="xMidYMid slice"/><rect width="512" height="512" fill="url(#overlay)"/></g></svg>`
    return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
  }

  if (album.cover_photo_id) {
    const origin = getOrigin(c)
    const coverUrl = `${origin}/api/photos/file/${album.cover_photo_id}`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><clipPath id="r"><rect width="512" height="512" rx="112" ry="112" /></clipPath><linearGradient id="overlay" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="rgba(15,23,42,0.20)"/><stop offset="100%" stop-color="rgba(37,99,235,0.10)"/></linearGradient></defs><g clip-path="url(#r)"><image href="${coverUrl}" width="512" height="512" preserveAspectRatio="xMidYMid slice"/><rect width="512" height="512" fill="url(#overlay)"/></g></svg>`
    return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
  }

  const txt = String(album.name || '相册').trim().slice(0, 2)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb" /><stop offset="100%" stop-color="#4f46e5" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)" /><text x="256" y="292" text-anchor="middle" font-size="190" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-weight="800" letter-spacing="-10" fill="#ffffff">${txt}</text></svg>`
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=86400' } })
})'''

new_icon = '''app.get('/api/private-albums/:slug/icon.svg', async (c) => {
  const slug = c.req.param('slug')
  const album = await c.env.DB.prepare(`SELECT id, name, slug, cover_photo_id, pwa_icon_url FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`).bind(slug).first<any>()
  if (!album) return c.json({ error: 'Album not found' }, 404)

  if (album.pwa_icon_url) {
    const raw = String(album.pwa_icon_url)
    if (raw.startsWith('data:')) {
      const m = raw.match(/^data:([^;]+);base64,(.*)$/)
      if (m) {
        const mime = m[1]
        const body = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0))
        return new Response(body, { headers: { 'content-type': mime, 'cache-control': 'no-store' } })
      }
    }
    const iconUrl = raw.startsWith('http') ? raw : `${getOrigin(c)}${raw.startsWith('/') ? raw : '/' + raw}`
    const res = await fetch(iconUrl)
    return new Response(res.body, { headers: { 'content-type': res.headers.get('content-type') || 'image/png', 'cache-control': 'no-store' } })
  }

  if (album.cover_photo_id) {
    return servePhotoFile(c, String(album.cover_photo_id))
  }

  const txt = String(album.name || '相册').trim().slice(0, 2)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb" /><stop offset="100%" stop-color="#4f46e5" /></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)" /><text x="256" y="292" text-anchor="middle" font-size="190" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-weight="800" letter-spacing="-10" fill="#ffffff">${txt}</text></svg>`
  return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=86400' } })
})'''

if old_icon in text:
    text = text.replace(old_icon, new_icon)
else:
    raise SystemExit('icon route block not found')

api.write_text(text)

print('patched api for icon cache/version/source')
