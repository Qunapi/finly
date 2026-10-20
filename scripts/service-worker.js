/* Generated after export; each release receives a content-based cache version. */
const CACHE = "__CACHE__";
const ASSETS = "__ASSETS__";
const PREFIX = `finly-${new URL(self.registration.scope).pathname}-`;
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch {
          const cache = await caches.open(CACHE);
          const pathname = url.pathname;
          const file = pathname.endsWith("/") ? `${pathname}index.html` : `${pathname}.html`;
          return (await cache.match(file)) || (await cache.match(pathname)) || Response.error();
        }
      })(),
    );
  } else {
    // Only release assets are cached. Live currency rates remain network requests.
    event.respondWith(
      caches
        .open(CACHE)
        .then(async (cache) => (await cache.match(event.request, { ignoreSearch: true })) || fetch(event.request)),
    );
  }
});
