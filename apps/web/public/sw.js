// TimeFlow Service Worker — Phase 8
// Handles: offline caching, background sync, push notifications

const CACHE_NAME = 'timeflow-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/schedule',
  '/streak',
  '/settings',
  '/offline',
]

// ── Install: pre-cache shell ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache what we can — non-blocking for others
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Partial failure ok during install
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: clear old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first with offline fallback ───────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip: non-GET, cross-origin, API, socket
  if (request.method !== 'GET') return
  if (!url.origin.includes(self.location.origin)) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // Next.js static assets — cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // App pages — network-first, fall back to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match('/offline')
        )
      )
  )
})

// ── Background sync: queue failed API calls ─────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncPendingLogs())
  }
})

async function syncPendingLogs() {
  try {
    const cache = await caches.open('timeflow-offline-queue')
    const keys = await cache.keys()
    await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key)
        if (!response) return
        const body = await response.json()
        await fetch('/api/daily-logs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        await cache.delete(key)
      })
    )
  } catch (err) {
    console.warn('[SW] Sync failed:', err)
  }
}

// ── Push notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'TimeFlow', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag ?? 'timeflow',
      data: { url: data.url ?? '/dashboard' },
      actions: data.actions ?? [],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(url))
        if (existing) return existing.focus()
        return clients.openWindow(url)
      })
  )
})
