/* Undanu service worker: makes the dashboard installable and usable on flaky connections.
   - App shell (dashboard, styles, scripts, icons) is precached.
   - Pages: network first, falling back to the cached copy, then an offline page.
   - Static assets: stale-while-revalidate.
   - API calls and uploads are never cached (always live data). */
const VERSION = 'undanu-v1';
const SHELL = [
  '/app',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/app.css',
  '/assets/app.js',
  '/assets/presets.js',
  '/assets/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(url.pathname === '/app/' ? '/app' : request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(VERSION);
          const cachedPage = await cache.match(request, { ignoreSearch: true });
          if (cachedPage) {
            return cachedPage;
          }
          if (url.pathname.startsWith('/app')) {
            const shell = await cache.match('/app');
            if (shell) {
              return shell;
            }
          }
          return cache.match('/offline.html');
        })
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
