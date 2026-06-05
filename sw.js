const CACHE = 'youridealtravel-v4';

const LOCAL_ASSETS = [
  '/youridealtravel/',
  '/youridealtravel/index.html',
  '/youridealtravel/styles.css',
  '/youridealtravel/js/app.js',
  '/youridealtravel/manifest.json',
  '/youridealtravel/icons/icon-192.png',
  '/youridealtravel/icons/icon-512.png',
];

const EXTERNAL_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Cache local files on install — always works
// Try external CDN files but don't fail if unavailable
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(LOCAL_ASSETS);
      await Promise.allSettled(
        EXTERNAL_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// Remove old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for everything except Google Sheets syncs
self.addEventListener('fetch', event => {
  if (event.request.url.includes('docs.google.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
