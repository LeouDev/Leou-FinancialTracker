// ── Leou Finance PWA Service Worker ──────────────────────────
const CACHE_NAME = 'leou-finance-v1';

// Core files to cache for offline use
const STATIC_ASSETS = [
  '/Leou-FinancialTracker/',
  '/Leou-FinancialTracker/index.html',
  '/Leou-FinancialTracker/manifest.json',
  '/Leou-FinancialTracker/icon-192.png',
  '/Leou-FinancialTracker/icon-512.png',
];

// ── INSTALL: cache static assets ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean up old caches ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: network first, fallback to cache ───────────────────
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests (e.g. Supabase API)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache fresh responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/Leou-FinancialTracker/index.html');
        });
      })
  );
});
