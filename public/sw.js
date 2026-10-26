/* global self, caches, URL, fetch, Response */
/* Build replaces these constants. Only public app assets are cached. */
const VERSION = '__BUILD_ID__';
const CACHE = `smart-capture-shell-${VERSION}`;
const ASSETS = [];
const AI_CACHE = 'smart-capture-ai-v1';
const absolute = (path) => new URL(path, self.registration.scope).href;
const files = new Set(ASSETS.map(absolute));
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([...files]);
    // Updates wait until the operator chooses them or all old windows close.
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter((key) => key.startsWith('smart-capture-shell-') && key !== CACHE);
    for (const key of old.slice(0, -1)) await caches.delete(key);
    for (const key of await caches.keys()) if (/^smart-capture-v2-/.test(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SKIP_WAITING') return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const scoped = clients.filter((client) => client.url.startsWith(self.registration.scope));
    if (scoped.length > 1) { event.source?.postMessage({ type: 'UPDATE_BLOCKED' }); return; }
    await self.skipWaiting();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const isModel = url.pathname.startsWith(new URL('models/vehicle/', self.registration.scope).pathname);
  if (isModel && request.cache === 'no-store') return;
  if (!files.has(url.href) && request.mode !== 'navigate' && !isModel) return;
  event.respondWith((async () => {
    const cache = await caches.open(isModel ? AI_CACHE : CACHE);
    const key = request.mode === 'navigate' ? absolute('./index.html') : request;
    const saved = await cache.match(key, { ignoreVary: true });
    if (saved) return saved;
    try { return await fetch(request); } catch { return Response.error(); }
  })());
});
