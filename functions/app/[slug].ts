export const onRequest = async (context: any) => {
  const slug = String(context.params?.slug || '').trim()
  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const album = await context.env.DB.prepare(
    `SELECT id, name, slug, visibility, cover_photo_id, pwa_icon_url, pwa_splash_image_url FROM albums WHERE slug = ? AND visibility = 'private' LIMIT 1`
  ).bind(slug).first<any>()

  if (!album) return response

  const getOrigin = (url: string) => new URL(url).origin
  const hashString = (value: string) => {
    let h = 0
    for (let i = 0; i < value.length; i++) h = ((h << 5) - h) + value.charCodeAt(i)
    return Math.abs(h).toString(36)
  }

  let html = await response.text()
  const origin = getOrigin(context.request.url)
  const safeSlug = encodeURIComponent(album.slug)
  const safeTitle = `${album.name} · 私密相册`
  const safeDesc = `私密相册 ${album.name}，可添加到主屏幕作为独立相册使用。`
  const manifestHref = `${origin}/api/private-albums/${safeSlug}/manifest.webmanifest`
  // 用 icon 内容 hash 作为版本号，图标更新时自动变化
  const iconHash = hashString(String(album.pwa_icon_url || ''))
  const iconHref = `${origin}/api/private-albums/${safeSlug}/icon.png?v=${iconHash}`
  const splashSrc = album.pwa_splash_image_url?.startsWith('http')
    ? album.pwa_splash_image_url
    : `${origin}${album.pwa_splash_image_url || ''}`

  html = html.replace('<title>相册系统</title>', `<title>${safeTitle}</title>`)
  // 替换 theme-color
  html = html.replace(/<meta name="theme-color"[^>]*>/, `<meta name="theme-color" content="#ffffff" />`)
  // 追加 description
  if (!html.includes('name="description"')) {
    html = html.replace('</title>', `</title>\n    <meta name="description" content="${safeDesc}" />`)
  }
  // 追加 PWA meta
  if (!html.includes('apple-mobile-web-app-capable')) {
    html = html.replace('</title>', `</title>\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="default" />\n    <meta name="apple-mobile-web-app-title" content="${album.name}" />\n    <meta name="mobile-web-app-capable" content="yes" />`)
  }
  // 替换 manifest + icon + 启动图
  html = html.replace(
    '<link rel="manifest" href="/manifest.webmanifest" />',
    `<link rel="manifest" href="${manifestHref}" />\n    <link rel="apple-touch-icon" href="${iconHref}" />\n    <link rel="apple-touch-icon" sizes="180x180" href="${iconHref}" />\n    <link rel="apple-touch-icon" sizes="167x167" href="${iconHref}" />\n    <link rel="apple-touch-icon" sizes="152x152" href="${iconHref}" />\n    <link rel="apple-touch-icon" sizes="120x120" href="${iconHref}" />\n    <link rel="apple-touch-startup-image" href="${splashSrc}" media="screen and (orientation: portrait)" />\n    <link rel="apple-touch-startup-image" href="${splashSrc}" media="screen and (orientation: landscape)" />`
  )

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}
