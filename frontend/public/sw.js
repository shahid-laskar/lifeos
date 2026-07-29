/**
 * Muslim Life OS — Service Worker
 * ADR-012 Increment 3: PWA and offline foundation.
 *
 * Caching strategy:
 * - App shell (HTML, CSS, JS, icons): cache-first with network fallback.
 * - Read-only API data (Quran surahs, ayahs, Dhikr catalogue): network-first,
 *   cache on success, fall back to cache when offline.
 * - Authenticated API data (prayer times, progress, habits): network-first,
 *   short-lived cache for offline read.
 * - Mutation requests (/api/ POST/PUT/DELETE): never cached; the offline
 *   operation queue in queue.ts handles deferred mutations.
 *
 * Privacy: the service worker never logs request bodies or user IDs.
 * No telemetry. No analytics. (Article 9, ADR-003)
 */

const SHELL_CACHE = 'mlos-shell-v2'
const API_CACHE   = 'mlos-api-v2'

const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

// Read-only API endpoints safe to cache indefinitely (content never changes).
const STATIC_API_PREFIXES = [
  '/api/v1/quran/surahs',
  '/api/v1/dhikr/items',
]

// API endpoints that benefit from a short-lived cache for offline reads.
const DYNAMIC_API_PREFIXES = [
  '/api/v1/prayer/',
  '/api/v1/quran/',
  '/api/v1/dhikr/summary',
  '/api/v1/habits/',
  '/api/v1/users/me',
]

// ── Install: cache app shell ──────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// ── Activate: remove old caches ───────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  const active = new Set([SHELL_CACHE, API_CACHE])
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !active.has(k)).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  const path = url.pathname

  // API: static read-only content — network-first, cache indefinitely.
  if (STATIC_API_PREFIXES.some((p) => path.startsWith(p))) {
    event.respondWith(networkFirstApi(request, Infinity))
    return
  }

  // API: dynamic authenticated content — network-first, cache for 5 minutes.
  if (DYNAMIC_API_PREFIXES.some((p) => path.startsWith(p))) {
    event.respondWith(networkFirstApi(request, 5 * 60 * 1000))
    return
  }

  // Skip other API calls (mutations, auth).
  if (path.startsWith('/api/')) return

  // App shell assets: cache-first.
  event.respondWith(cacheFirstShell(request))
})

// ── Strategy: network-first for API responses ─────────────────────────────────

async function networkFirstApi(request, maxAgeMs) {
  const cache = await caches.open(API_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      // Attach a timestamp header so we can check freshness later.
      const headers = new Headers(clone.headers)
      headers.set('sw-cached-at', Date.now().toString())
      const timestamped = new Response(await clone.blob(), { status: clone.status, headers })
      cache.put(request, timestamped)
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10)
      if (maxAgeMs === Infinity || Date.now() - cachedAt < maxAgeMs) {
        return cached
      }
    }
    // No cache — return a minimal offline response.
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ── Strategy: cache-first for app shell ──────────────────────────────────────

async function cacheFirstShell(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    const cache = await caches.open(SHELL_CACHE)
    cache.put(request, response.clone())
    return response
  } catch {
    const fallback = await caches.match('/index.html')
    return fallback || new Response('Offline', { status: 503 })
  }
}
