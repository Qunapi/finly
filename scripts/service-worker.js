// Retirement worker for installations from before offline caching was removed.
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const prefix = `finly-${new URL(self.registration.scope).pathname}-`;
      for (const key of await caches.keys()) {
        if (key.startsWith(prefix)) await caches.delete(key);
      }
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) await client.navigate(client.url);
    })(),
  );
});
