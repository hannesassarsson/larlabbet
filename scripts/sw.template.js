/* Leklandet service worker – genereras av vite.config.ts vid bygget. */
const VERSION = '__VERSION__';
const CACHE = 'leklandet-' + VERSION;
const PRECACHE = __PRECACHE__;

// Installera: ladda ned hela appen till en ny, versionsbunden cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
  // Vänta inte med att aktivera första gången (ingen gammal version finns).
  if (!self.registration.active) self.skipWaiting();
});

// Aktivera: ta bort alla äldre Leklandet-cacher så att ingen fastnar i en gammal version.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('leklandet-') && k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Appen ber om att den nya versionen ska ta över när användaren trycker "Uppdatera".
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION' && event.source) {
    event.source.postMessage({ type: 'VERSION', version: VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Sidnavigering (/, /installera, /spel/memory …): nätverk först så att nya
  // versioner hittas, med den cachade appen som reserv när enheten är offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/', { cacheName: CACHE, ignoreVary: true }).then((r) => r || caches.match('/', { ignoreVary: true })))
    );
    return;
  }

  // Statiska resurser (filnamn med hash, ikoner, manifest): cache först.
  event.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
