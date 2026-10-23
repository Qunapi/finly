const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/url-updates.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

const { createUrlUpdater } = queryModule.exports;
function harness() {
  let now = 0,
    url = new URL("https://example.com/finly/salary?lang=en&campaign=test#results");
  const timers = new Set(),
    writes = [];
  let denied = false;
  const updater = createUrlUpdater({
    read: () => new URL(url),
    replace: (value) => {
      if (denied) throw Object.assign(new Error("Safari quota"), { name: "SecurityError" });
      writes.push({ time: now, value });
      url = new URL(value, url);
    },
    schedule: (callback, delay) => {
      const timer = { time: now + delay, callback };
      timers.add(timer);
      return () => timers.delete(timer);
    },
  });
  return {
    updater,
    writes,
    timers,
    deny: (value) => {
      denied = value;
    },
    url: () => url,
    advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers].filter((timer) => timer.time <= end).sort((a, b) => a.time - b.time)[0];
        if (!next) break;
        now = next.time;
        timers.delete(next);
        next.callback();
      }
      now = end;
    },
  };
}

test("thousands of slider events stay below Safari's 100 history writes per 30 seconds", () => {
  const h = harness();
  for (let value = 0; value < 3000; value++) {
    h.updater.queue("calculator", (url) => url.searchParams.set("amount", String(value)));
    h.advance(10);
  }
  h.advance(500);
  assert.ok(h.writes.length <= 61);
  assert.equal(h.url().searchParams.get("amount"), "2999");
  assert.equal(h.url().searchParams.get("campaign"), "test");
  assert.equal(h.url().hash, "#results");
});

test("language and calculator updates merge without stale query overwrites", () => {
  const h = harness();
  h.updater.queue("calculator", (url) => {
    url.pathname = "/finly/mortgage";
    url.searchParams.set("price", "1500000");
  });
  h.updater.queue("language", (url) => url.searchParams.set("lang", "ru"));
  h.advance(500);
  assert.equal(h.writes.length, 1);
  assert.equal(h.url().pathname, "/finly/mortgage");
  assert.equal(h.url().searchParams.get("price"), "1500000");
  assert.equal(h.url().searchParams.get("lang"), "ru");
  assert.equal(h.url().searchParams.get("campaign"), "test");
});

test("Safari quota errors do not crash the app and retry the newest value", () => {
  const h = harness();
  h.deny(true);
  h.updater.queue("calculator", (url) => url.searchParams.set("amount", "10000"));
  assert.doesNotThrow(() => h.advance(500));
  assert.equal(h.writes.length, 0);
  h.updater.queue("calculator", (url) => url.searchParams.set("amount", "20000"));
  assert.doesNotThrow(() => h.advance(1000));
  assert.equal(h.writes.length, 0);
  h.deny(false);
  h.advance(2000);
  assert.equal(h.writes.length, 1);
  assert.equal(h.url().searchParams.get("amount"), "20000");
});

test("navigation flush saves the final value and unchanged URLs are not rewritten", () => {
  const h = harness();
  h.updater.queue("language", (url) => url.searchParams.set("lang", "en"));
  h.advance(500);
  assert.equal(h.writes.length, 0);
  h.updater.queue("calculator", (url) => url.searchParams.set("amount", "25000"));
  h.updater.flush();
  assert.equal(h.url().searchParams.get("amount"), "25000");
  h.advance(1000);
  assert.equal(h.writes.length, 1);
});
