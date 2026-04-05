self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('tg-album-shell-v4').then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg'])))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
const trimCache = async (name, maxEntries) => {
  const cache = await caches.open(name)
  const keys = await cache.keys()
  while (keys.length > maxEntries) await cache.delete(keys.shift())
}
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/') || Response.error()))
    return
  }
  if (url.pathname.startsWith('/api/photos/file/')) {
    event.respondWith(caches.open('tg-album-images-v4').then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req).then(async (res) => {
        if (res.ok) { await cache.put(req, res.clone()); await trimCache('tg-album-images-v4', 80) }
        return res
      }).catch(() => cached)
      return cached || network
    }))
    return
  }
  if (url.pathname.startsWith('/assets/') || /\.(css|js|svg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(caches.open('tg-album-static-v4').then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req).then(async (res) => { if (res.ok) await cache.put(req, res.clone()); return res }).catch(() => cached)
      return cached || network
    }))
  }
})
