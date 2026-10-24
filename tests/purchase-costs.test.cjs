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

const settings = {
  agent: true,
  agentVat: true,
  pcc: true,
  notary: true,
  inspection: true,
  valuation: true,
  mortgageFee: true,
  notaryAmount: 5000,
  inspectionAmount: 1500,
  valuationAmount: 750,
  mortgageFeePercent: 2,
};
const { calculatePurchaseCosts } = queryModule.exports;
test("resale purchase budget includes 3% agency fee, separate VAT and commission on the loan", () => {
  const result = calculatePurchaseCosts(1500000, 300000, 1200000, settings);
  assert.deepEqual(result.amounts, {
    agent: 45000,
    agentVat: 10350,
    pcc: 30000,
    notary: 5000,
    inspection: 1500,
    valuation: 750,
    mortgageFee: 24000,
  });
  assert.equal(result.total, 116600);
  assert.equal(result.upfront, 416600);
  assert.equal(result.purchaseTotal, 1616600);
});
test("each cost can be disabled and VAT never remains without an agent fee", () => {
  const baseline = calculatePurchaseCosts(1500000, 300000, 1200000, settings);
  for (const key of ["agent", "agentVat", "pcc", "notary", "inspection", "valuation", "mortgageFee"]) {
    const result = calculatePurchaseCosts(1500000, 300000, 1200000, { ...settings, [key]: false });
    const reduction = baseline.amounts[key] + (key === "agent" ? baseline.amounts.agentVat : 0);
    assert.equal(result.total, baseline.total - reduction);
  }
  const disabled = {
    ...settings,
    agent: false,
    agentVat: false,
    pcc: false,
    notary: false,
    inspection: false,
    valuation: false,
    mortgageFee: false,
  };
  assert.equal(calculatePurchaseCosts(1500000, 300000, 1200000, disabled).total, 0);
});
test("editable fees, cash purchases and rounding are handled", () => {
  const result = calculatePurchaseCosts(1000000, 1000000, 0, {
    ...settings,
    pcc: false,
    notaryAmount: 3000,
    inspectionAmount: 500,
    valuationAmount: 0,
  });
  assert.equal(result.amounts.mortgageFee, 0);
  assert.equal(result.total, 40400);
  assert.equal(result.upfront, 1040400);
  assert.equal(calculatePurchaseCosts(123456.78, 0, 123456.78, settings).amounts.agent, 3703.7);
});
