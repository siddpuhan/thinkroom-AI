// Service Worker - Network First strategy for dev safety
const CACHE_NAME = 'thinkroom-ai-cache-v2';

// Only cache the final built assets (not raw source files)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', event => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  // Delete old caches from previous versions
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('SW: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Use Network First: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful GET responses for static assets only
        if (event.request.method === 'GET' && response.status === 200) {
          const url = new URL(event.request.url);
          // Only cache same-origin, non-source-file requests
          if (url.origin === self.location.origin && !url.pathname.startsWith('/src/')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
