const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/purchase-costs.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

const settings = { agent: true, pcc: true, fixedFees: true, emergency: false };
const { calculatePurchaseCosts } = queryModule.exports;
test("agent 3% is VAT-inclusive, fixed fees are combined and totals do not add VAT twice", () => {
  const result = calculatePurchaseCosts(1500000, 300000, settings);
  assert.deepEqual(result.amounts, { agent: 45000, pcc: 30000, fixedFees: 7250, emergency: 0 });
  assert.equal(result.agentVatIncluded, 8414.63);
  assert.equal(result.total, 82250);
  assert.equal(result.upfront, 382250);
  assert.equal(result.purchaseTotal, 1582250);
});
test("each combined cost can be excluded independently", () => {
  const baseline = calculatePurchaseCosts(1500000, 300000, settings);
  for (const key of Object.keys(settings)) {
    const result = calculatePurchaseCosts(1500000, 300000, { ...settings, [key]: false });
    assert.equal(result.total, baseline.total - baseline.amounts[key]);
    if (key === "agent") assert.equal(result.agentVatIncluded, 0);
  }
  assert.equal(
    calculatePurchaseCosts(1500000, 300000, { agent: false, pcc: false, fixedFees: false, emergency: false }).total,
    0,
  );
});
test("cash purchases have no bank commission and included VAT is extracted correctly", () => {
  const result = calculatePurchaseCosts(1000000, 1000000, { ...settings, pcc: false });
  assert.equal("mortgageFee" in result.amounts, false);
  assert.equal(result.total, 37250);
  assert.equal(result.upfront, 1037250);
  const small = calculatePurchaseCosts(123456.78, 0, settings);
  assert.equal(small.amounts.agent, 3703.7);
  assert.equal(small.agentVatIncluded, 692.56);
});

test("emergency reserve adds 100000 only to upfront cash, not costs or purchase price", () => {
  const baseline = calculatePurchaseCosts(1500000, 300000, settings);
  const enabled = calculatePurchaseCosts(1500000, 300000, { ...settings, emergency: true });
  assert.equal(baseline.amounts.emergency, 0);
  assert.equal(enabled.amounts.emergency, 100000);
  assert.equal(enabled.upfront, baseline.upfront + 100000);
  assert.equal(enabled.total, baseline.total);
  assert.equal(enabled.purchaseTotal, baseline.purchaseTotal);
});
