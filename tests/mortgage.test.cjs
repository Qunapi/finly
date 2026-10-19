const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/mortgage.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

test("schedule repays principal and totals agree to the grosz", () => {
  for (const mode of ["payment", "duration"]) {
    const result = queryModule.exports.calculateMortgage(400000, 6.5, 30, 500, mode);
    assert.equal(result.schedule.at(-1).balance, 0);
    const sum = (key) => Math.round(result.schedule.reduce((total, row) => total + row[key], 0) * 100) / 100;
    assert.equal(sum("principal"), 400000);
    assert.equal(sum("total"), result.total);
    assert.equal(sum("interest"), result.interest);
    assert.equal(Math.round((result.total - result.interest) * 100), 40000000);
    assert.ok(result.schedule.every((row) => row.balance >= 0 && row.overpayment >= 0));
  }
});
test("overpayment reduces installments by default or shortens duration", () => {
  const { calculateMortgage } = queryModule.exports;
  const baseline = calculateMortgage(400000, 6.5, 30);
  const payment = calculateMortgage(400000, 6.5, 30, 500);
  const duration = calculateMortgage(400000, 6.5, 30, 500, "duration");
  assert.ok(Math.abs(baseline.payment - 2528.27) < 0.01);
  assert.equal(baseline.months, 360);
  // A fixed extra payment may clear the last installments early even as the required payment falls.
  assert.ok(payment.months <= 360);
  assert.ok(duration.months < payment.months);
  assert.ok(payment.schedule[1].payment < payment.schedule[0].payment);
  assert.ok(duration.months < 360);
  assert.equal(duration.schedule[0].payment, duration.schedule[1].payment);
  assert.ok(payment.interest < baseline.interest);
  assert.ok(duration.interest < payment.interest);
});
test("zero rate, zero loan and final overpayment are handled", () => {
  const { calculateMortgage } = queryModule.exports;
  assert.equal(calculateMortgage(0, 6.5, 30, 100).schedule.length, 0);
  const zero = calculateMortgage(1200, 0, 1, 100, "duration");
  assert.equal(zero.months, 6);
  assert.equal(zero.interest, 0);
  assert.equal(zero.total, 1200);
  const paid = calculateMortgage(1000, 0, 1, 100000);
  assert.equal(paid.months, 1);
  assert.equal(paid.total, 1000);
  assert.equal(paid.schedule[0].overpayment, 916.67);
});
