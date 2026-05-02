/**
 * NextBite Service Worker
 * Caching strategy:
 *   - App shell (HTML, JS, CSS, icons): Cache First
 *   - Restaurant photos (Supabase Storage CDN): Stale While Revalidate, max 50
 *   - API routes (/api/*): Network First with cache fallback
 *   - Supabase REST: Network First with cache fallback
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE = `nextbite-shell-${CACHE_VERSION}`
const PHOTO_CACHE = `nextbite-photos-${CACHE_VERSION}`
const API_CACHE = `nextbite-api-${CACHE_VERSION}`

const SHELL_URLS = [
  '/',
  '/sign-in',
  '/manifest.json',
]

const PHOTO_CACHE_MAX = 50
const API_CACHE_MAX = 100

// ─── Install ──────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  )
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('nextbite-') &&
              key !== SHELL_CACHE &&
              key !== PHOTO_CACHE &&
              key !== API_CACHE
          )
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin (except Supabase storage)
  if (request.method !== 'GET') return

  // Restaurant photos — Stale While Revalidate
  if (
    url.hostname.includes('supabase.co') &&
    url.pathname.includes('/storage/')
  ) {
    event.respondWith(staleWhileRevalidate(request, PHOTO_CACHE, PHOTO_CACHE_MAX))
    return
  }

  // Next.js static assets — Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // API routes and Supabase REST — Network First
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co')
  ) {
    event.respondWith(networkFirst(request, API_CACHE, API_CACHE_MAX))
    return
  }

  // App shell pages — Cache First (serve shell, let client-side routing handle the rest)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }
})

// ─── Strategies ───────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      await trimCache(cache, maxEntries - 1)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    return cached ?? new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      await trimCache(cache, maxEntries - 1)
      cache.put(request, response.clone())
    }
    return response
  })

  return cached ?? fetchPromise
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys()
  if (keys.length > maxEntries) {
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)))
  }
}
