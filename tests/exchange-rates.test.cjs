const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/exchange-rates.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const ratesModule = new Module(filename, module);
ratesModule.filename = filename;
ratesModule.paths = Module._nodeModulePaths(path.dirname(filename));
ratesModule._compile(compiled.outputText, filename);

test("fetches PLN quotes directly for a static site", async (t) => {
  t.mock.method(global, "fetch", async (url, options) => {
    const request = new URL(url);
    assert.equal(request.origin, "https://api.frankfurter.dev");
    assert.equal(request.pathname, "/v2/rates");
    assert.equal(request.searchParams.get("base"), "PLN");
    assert.equal(request.searchParams.get("quotes"), "EUR,USD");
    assert.equal(options, undefined);
    return {
      ok: true,
      json: async () => [
        { quote: "USD", rate: 0.27, date: "2026-10-18" },
        { quote: "EUR", rate: 0.23, date: "2026-10-19" },
      ],
    };
  });
  assert.deepEqual(await ratesModule.exports.fetchExchangeRates(), {
    EUR: 0.23,
    USD: 0.27,
    date: "2026-10-18 – 2026-10-19",
  });
});

test("rejects unavailable or malformed exchange rates", async (t) => {
  for (const payload of [
    null,
    [],
    [{ quote: "EUR", rate: -1, date: "2026-10-19" }],
    [
      { quote: "EUR", rate: 0.23, date: "2026-10-19" },
      { quote: "USD", rate: 0.27, date: "invalid" },
    ],
  ]) {
    const mock = t.mock.method(global, "fetch", async () => ({ ok: true, json: async () => payload }));
    await assert.rejects(ratesModule.exports.fetchExchangeRates(), /Invalid exchange rates/);
    mock.mock.restore();
  }
  t.mock.method(global, "fetch", async () => ({ ok: false }));
  await assert.rejects(ratesModule.exports.fetchExchangeRates(), /unavailable/);
});
