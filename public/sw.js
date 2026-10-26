/* global self, caches, URL, fetch, Response */
/* V2 static app shell. No background uploads and no caching of external APIs. */
const CACHE = 'smart-capture-v2-2';
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const scope = self.registration.scope;
      const paths = [
        './',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
        './references/sedan.png',
        './references/suv.png',
        './references/truck.png',
        './references/coupe.png',
        './references/wagon.png',
        './references/van.png',
        './references/convertible.png',
        './references/classic.png',
      ];
      const cache = await caches.open(CACHE);
      await cache.addAll(paths.map((p) => new URL(p, scope).href));
      const html = await (await fetch(new URL('./', scope))).text();
      const assets = [...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)].map(
        (m) => new URL(m[1], scope).href
      );
      await cache.addAll(assets);
      self.skipWaiting();
    })()
  );
});
self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith('smart-capture-') && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })()
  )
);
self.addEventListener('fetch', (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (
          response.ok &&
          (request.destination === 'script' ||
            request.destination === 'style' ||
            url.pathname.includes('/references/') ||
            url.pathname.includes('/models/'))
        )
          await cache.put(request, response.clone());
        return response;
      } catch {
        const saved = await cache.match(request, { ignoreVary: true });
        if (saved) return saved;
        if (request.mode === 'navigate') {
          const shell = await cache.match(new URL('./', self.registration.scope).href);
          if (shell) return shell;
        }
        return Response.error();
      }
    })()
  );
});
