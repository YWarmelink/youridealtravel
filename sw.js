const CACHE = 'youridealtravel-v1';

const ASSETS = [
  '/youridealtravel/',
  '/youridealtravel/index.html',
  '/youridealtravel/styles.css',
  '/youridealtravel/js/app.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Cache all assets on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve from cache, fall back to network
// Google Sheets CSV fetches always go to network (never cached)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Never cache Google Sheets syncs — always needs fresh data
  if (url.includes('docs.google.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
