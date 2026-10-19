const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/salary.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const salaryModule = new Module(filename, module);
salaryModule.filename = filename;
salaryModule.paths = Module._nodeModulePaths(path.dirname(filename));
salaryModule._compile(compiled.outputText, filename);

test("matches the 40,000 PLN reference result with PPK and no KUP", () => {
  const result = salaryModule.exports.calculateSalary(40000, false, false);

  assert.equal(result.employeeSocial, 5484);
  assert.equal(result.health, 3106.44);
  assert.equal(result.employeePpk, 800);
  assert.equal(result.annualTax, 4214);
  assert.equal(result.uopNet, 26395.56);
});

test("removing PPK removes employee withholding and employer PPK tax", () => {
  const result = salaryModule.exports.calculateSalary(40000, false, false, false);

  assert.equal(result.employeePpk, 0);
  assert.equal(result.employerPpk, 0);
  assert.equal(result.annualTax, 4142);
  assert.equal(result.uopNet, 27267.56);
});

test("50% copyright KUP is capped at 120,000 PLN and reduces PIT", () => {
  const noKup = salaryModule.exports.calculateSalary(40000, false, false);
  const withKup = salaryModule.exports.calculateSalary(40000, false, true);

  assert.equal(withKup.annualTax, 3014);
  assert.equal(withKup.uopNet, 27595.56);
  assert.ok(withKup.annualTax < noKup.annualTax);
});

test("under-26 exemption and copyright KUP share the 120,000 PLN cap", () => {
  const noReliefs = salaryModule.exports.calculateSalary(40000, false, false);
  const youthRelief = salaryModule.exports.calculateSalary(40000, true, false);
  const bothReliefs = salaryModule.exports.calculateSalary(40000, true, true);

  assert.ok(youthRelief.annualTax < noReliefs.annualTax);
  assert.ok(youthRelief.uopNet > noReliefs.uopNet);
  assert.equal(youthRelief.annualTax, 3474);
  assert.equal(bothReliefs.annualTax, 3129);
  assert.ok(bothReliefs.annualTax < youthRelief.annualTax);
  assert.ok(bothReliefs.uopNet > youthRelief.uopNet);
});

test("copyright KUP applies only to taxable income after youth relief", () => {
  const youthRelief = salaryModule.exports.calculateSalary(8000, true, false);
  const bothReliefs = salaryModule.exports.calculateSalary(8000, true, true);

  assert.equal(youthRelief.annualTax, 103);
  assert.equal(bothReliefs.annualTax, 59);
  assert.equal(bothReliefs.uopNet, 6062.912);
});
