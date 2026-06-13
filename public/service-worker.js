// Derive the base path from the SW script URL so this file works correctly
// whether it is served from `/` or a sub-path such as `/kingdom/`.
// e.g. SW at /kingdom/service-worker.js → BASE = '/kingdom/'
const BASE = new URL('./', self.location).pathname;

const CACHE_NAME = `kingdom-builder${BASE.replace(/\//g, '-').replace(/-$/, '')}-v1`;

const PRECACHE_ASSETS = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}manifest.json`,
  `${BASE}icons/icon-192.svg`,
  `${BASE}icons/icon-512.svg`,
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin or same-site assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful responses for http(s) requests
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'opaque'
        ) {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});
