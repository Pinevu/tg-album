export const onRequest = async (context: any) => {
  const slug = String(context.params?.slug || '').trim()
  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const album = await context.env.DB.prepare(
    `SELECT id, name, slug, visibility FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`
  ).bind(slug).first<any>()

  if (!album) return response

  let html = await response.text()
  const safeSlug = encodeURIComponent(album.slug)
  const safeTitle = `${album.name} · 私密相册`
  const safeDesc = `私密相册 ${album.name}，可添加到主屏幕作为独立相册使用。`
  const manifestHref = `/api/private-albums/${safeSlug}/manifest.webmanifest`
  const iconHref = `/api/private-albums/${safeSlug}/icon.svg`

  html = html.replace('<title>相册系统</title>', `<title>${safeTitle}</title>`)
  html = html.replace(
    '<meta name="theme-color" content="#f8fafc" />',
    `<meta name="theme-color" content="#2563eb" />\n    <meta name="description" content="${safeDesc}" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="default" />\n    <meta name="apple-mobile-web-app-title" content="${album.name}" />\n    <meta name="mobile-web-app-capable" content="yes" />`
  )
  html = html.replace(
    '<link rel="manifest" href="/manifest.webmanifest" />',
    `<link rel="manifest" href="${manifestHref}" />\n    <link rel="apple-touch-icon" href="${iconHref}" />`
  )

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}
