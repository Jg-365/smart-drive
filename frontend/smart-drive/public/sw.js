/*
 * SmartDrive service worker — offline shell mínimo (PWA, EPIC-C3).
 * Estratégia:
 *  - navegações (HTML): network-first com fallback para o shell '/' em cache;
 *  - estáticos same-origin (GET): stale-while-revalidate;
 *  - API/WebSocket (/api, socket.io) e métodos não-GET: nunca cacheia (passa direto).
 * O versionamento do CACHE limpa caches antigos a cada atualização do SW.
 */
const CACHE = 'smartdrive-v1'
const SHELL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(SHELL)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

function isCacheable(request, url) {
  return (
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/socket.io')
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Navegações: tenta a rede; offline → shell em cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(SHELL, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(SHELL).then((r) => r || Response.error())),
    )
    return
  }

  if (!isCacheable(request, url)) return

  // Estáticos: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
