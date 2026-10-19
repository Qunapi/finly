const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/number-format.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

test("formats thousands and parses displayed Polish numbers", () => {
  const { numberFormat, parseNumberInput } = queryModule.exports;
  assert.equal(numberFormat.format(1500).replace(/\s/g, " "), "1 500");
  assert.equal(numberFormat.format(15000).replace(/\s/g, " "), "15 000");
  assert.equal(numberFormat.format(1200000.5).replace(/\s/g, " "), "1 200 000,5");
  for (const amount of [0, 15000, 1200000.5, 12345.67, 6.5]) {
    assert.equal(parseNumberInput(numberFormat.format(amount)), amount);
  }
  assert.equal(parseNumberInput("15 000,50"), 15000.5);
  assert.equal(parseNumberInput("15000.50"), 15000.5);
  assert.equal(parseNumberInput("6,"), 6);
  assert.equal(parseNumberInput(""), 0);
  for (const invalid of ["NaN", "Infinity", "-1", "1,2,3", "1e6", "abc"]) assert.equal(parseNumberInput(invalid), null);
});
