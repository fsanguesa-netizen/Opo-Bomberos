const PREFIX = 'opo-bomberos-shell-';
const CACHE = `${PREFIX}2026-10-12-v1`;

const BASE = new URL(self.registration.scope);
const INDEX = new URL('index.html', BASE).href;

const ASSETS = [
  INDEX,
  new URL('manifest.json', BASE).href,
  new URL('icon.svg', BASE).href
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(
        ASSETS.map(url => new Request(url, { cache: 'reload' }))
      )
    )
  );

  // La actualización espera hasta que se cierren
  // las pestañas que utilizan el worker anterior.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key.startsWith(PREFIX) && key !== CACHE)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== BASE.origin) return;
  if (!url.pathname.startsWith(BASE.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(INDEX);

      return cached || fetch(request);
    })());

    return;
  }

  if (ASSETS.includes(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      return cached || fetch(request);
    })());
  }
});
