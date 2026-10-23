const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

for (const scope of ["/finly/", "/"]) {
  test(`old PWA retires automatically and removes only its own caches (${scope})`, async () => {
    const handlers = new Map(),
      removed = [],
      navigated = [];
    let skipped = false,
      unregistered = false;
    const prefix = `finly-${scope}-`;
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../scripts/service-worker.js"), "utf8"), {
      URL,
      caches: {
        keys: async () => [`${prefix}old`, "unrelated-cache", "finly-/other/-old"],
        delete: async (key) => removed.push(key),
      },
      self: {
        registration: {
          scope: `https://example.com${scope}`,
          unregister: async () => {
            unregistered = true;
          },
        },
        addEventListener: (name, handler) => handlers.set(name, handler),
        skipWaiting: async () => {
          skipped = true;
        },
        clients: {
          matchAll: async () => [
            {
              url: `https://example.com${scope}salary?amount=25000&lang=en`,
              navigate: async (url) => navigated.push(url),
            },
          ],
        },
      },
    });
    assert.equal(handlers.has("fetch"), false);
    let installing;
    handlers.get("install")({
      waitUntil: (promise) => {
        installing = promise;
      },
    });
    await installing;
    assert.equal(skipped, true);
    let activating;
    handlers.get("activate")({
      waitUntil: (promise) => {
        activating = promise;
      },
    });
    await activating;
    assert.deepEqual(removed, [`${prefix}old`]);
    assert.equal(unregistered, true);
    assert.deepEqual(navigated, [`https://example.com${scope}salary?amount=25000&lang=en`]);
  });
}
