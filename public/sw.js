const CACHE_NAME = 'asar-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Stale-while-revalidate for everything
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Don't cache non-successful responses or cross-origin (unless basic)
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Cache the new response for next time
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // If network fails and we don't have it in cache, return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return null;
      });

      // Return cached response immediately if we have it, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
