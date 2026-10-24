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

const settings = { agent: true, pcc: true, fixedFees: true, mortgageFee: true };
const { calculatePurchaseCosts } = queryModule.exports;
test("agent 3% is VAT-inclusive, fixed fees are combined and totals do not add VAT twice", () => {
  const result = calculatePurchaseCosts(1500000, 300000, 1200000, settings);
  assert.deepEqual(result.amounts, { agent: 45000, pcc: 30000, fixedFees: 7250, mortgageFee: 24000 });
  assert.equal(result.agentVatIncluded, 8414.63);
  assert.equal(result.total, 106250);
  assert.equal(result.upfront, 406250);
  assert.equal(result.purchaseTotal, 1606250);
});
test("each combined cost can be excluded independently", () => {
  const baseline = calculatePurchaseCosts(1500000, 300000, 1200000, settings);
  for (const key of Object.keys(settings)) {
    const result = calculatePurchaseCosts(1500000, 300000, 1200000, { ...settings, [key]: false });
    assert.equal(result.total, baseline.total - baseline.amounts[key]);
    if (key === "agent") assert.equal(result.agentVatIncluded, 0);
  }
  assert.equal(
    calculatePurchaseCosts(1500000, 300000, 1200000, { agent: false, pcc: false, fixedFees: false, mortgageFee: false })
      .total,
    0,
  );
});
test("cash purchases have no bank commission and included VAT is extracted correctly", () => {
  const result = calculatePurchaseCosts(1000000, 1000000, 0, { ...settings, pcc: false });
  assert.equal(result.amounts.mortgageFee, 0);
  assert.equal(result.total, 37250);
  assert.equal(result.upfront, 1037250);
  const small = calculatePurchaseCosts(123456.78, 0, 123456.78, settings);
  assert.equal(small.amounts.agent, 3703.7);
  assert.equal(small.agentVatIncluded, 692.56);
});
