export const onRequest = async (context: any) => {
  const slug = String(context.params?.slug || '').trim()
  if (!slug || slug.includes('/') || slug.length > 40 || !/^[a-z0-9_-]+$/i.test(slug)) {
    return context.next()
  }
  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const album = await context.env.DB.prepare(
    `SELECT id, name, slug, visibility, cover_photo_id, pwa_icon_url, pwa_splash_image_url FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`
  ).bind(slug).first<any>()
  if (!album) return response

  let html = await response.text()
  const safeSlug = encodeURIComponent(album.slug)
  const safeTitle = `${album.name} · 私密相册`
  const splashSrc = album.pwa_splash_image_url || `/api/private-albums/${safeSlug}/icon.png`

  html = html.replace('<title>相册系统</title>', `<title>${safeTitle}</title>`)

  html = html.replace(
    '<link rel="manifest" href="/manifest.webmanifest" />',
    `<link rel="manifest" href="/api/private-albums/${safeSlug}/manifest.webmanifest" />\n    <link rel="apple-touch-icon" href="/api/private-albums/${safeSlug}/icon.png" />\n    <link rel="apple-touch-startup-image" href="${splashSrc}" media="screen and (orientation: portrait)" />\n    <link rel="apple-touch-startup-image" href="${splashSrc}" media="screen and (orientation: landscape)" />`
  )

  if (!html.includes('apple-mobile-web-app-capable')) {
    html = html.replace('<meta name="theme-color" content="#ffffff" />',
      `<meta name="theme-color" content="#ffffff" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="default" />\n    <meta name="apple-mobile-web-app-title" content="${album.name}" />\n    <meta name="mobile-web-app-capable" content="yes" />`)
  }

  return new Response(html, {
    status: response.status, statusText: response.statusText, headers: response.headers
  })
}
