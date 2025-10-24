// Simple service worker for caching core assets and runtime caching for images
const CACHE_NAME = 'browndripz-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/pages/homepage.html',
  '/css/main.css',
  '/js/performance.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Cache-first strategy with network fallback. Runtime cache for images and same-origin assets.
self.addEventListener('fetch', event => {
  const req = event.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Prefer cached response first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        // Put a clone in the cache for future requests (best-effort)
        try {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Only cache successful responses
            if (networkRes && networkRes.status === 200) cache.put(req, resClone);
          });
        } catch (e) {
          // Ignore cache failures (storage quota, etc.)
        }
        return networkRes;
      }).catch(() => {
        // If request is for a navigation, serve the cached homepage as fallback
        if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
          return caches.match('/pages/homepage.html') || caches.match('/index.html');
        }
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      });
    })
  );
});
