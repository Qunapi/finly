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

const { calculateAnnualSalary, calculateSalary, annualIncomeTax, findEquivalentAmount } = salaryModule.exports;

test("annual PIT uses the 30000 tax-free allowance and marginal 12%/32% bands", () => {
  assert.equal(annualIncomeTax(0), 0);
  assert.equal(annualIncomeTax(30000), 0);
  assert.equal(annualIncomeTax(40000), 1200);
  assert.equal(annualIncomeTax(120000), 10800);
  assert.equal(annualIncomeTax(120100), 10832);
  assert.equal(annualIncomeTax(200000), 36400);
});

test("120000 gross employment reference includes standard costs and annual tax-free allowance", () => {
  const result = calculateAnnualSalary(120000, false, false, false);
  assert.equal(result.annualEmployeeSocial, 16452);
  assert.equal(result.annualHealth, 9319.32);
  assert.equal(result.annualCosts, 3000);
  assert.equal(result.annualTaxBase, 100548);
  assert.equal(result.annualTax, 8466);
  assert.equal(result.annualUopNet, 85762.68);
  assert.equal(Math.round(result.uopNet * 100) / 100, 7146.89);
});

test("youth exemption covers only the first 85528 of annual eligible income", () => {
  const atLimit = calculateAnnualSalary(85528, true, false, false);
  const above = calculateAnnualSalary(120000, true, false, false);
  assert.equal(atLimit.exemptIncome, 85528);
  assert.equal(atLimit.taxableSocial, 0);
  assert.equal(atLimit.annualTax, 0);
  assert.equal(above.exemptIncome, 85528);
  assert.equal(above.months[0].exemptIncome, 10000);
  assert.equal(above.months[8].exemptIncome, 5528);
  assert.equal(above.months[9].exemptIncome, 0);
  assert.ok(above.taxableSocial < above.annualEmployeeSocial);
  const high = calculateAnnualSalary(480000, true, false, false);
  assert.ok(high.annualTax > 0);
  assert.equal(high.exemptIncome, 85528);
});

test("50% copyright costs stop at 120000 and apply only to taxable copyright income", () => {
  const result = calculateAnnualSalary(480000, false, true, false);
  assert.equal(result.annualCopyrightCosts, 120000);
  const small = calculateAnnualSalary(120000, false, true, false);
  assert.equal(small.annualCopyrightCosts, (120000 - 16452) / 2);
  assert.ok(result.annualTax < calculateAnnualSalary(480000, false, false, false).annualTax);
  const exempt = calculateAnnualSalary(85528, true, true, false);
  assert.equal(exempt.annualCopyrightCosts, 0);
});

test("youth exemption and copyright costs share the 120000 annual limit", () => {
  const result = calculateAnnualSalary(480000, true, true, false);
  assert.equal(result.exemptIncome, 85528);
  assert.equal(result.annualCopyrightCosts, 34472);
  assert.equal(result.exemptIncome + result.annualCopyrightCosts, 120000);
  assert.equal(result.annualTaxBase, 328145);
  assert.equal(result.annualTax, 77406);
  // Exempt social contributions cannot also reduce taxable income.
  assert.equal(result.taxableSocial, 31854.87);
});

test("annual pension/disability cap stops those contributions but not sickness or health", () => {
  const result = calculateAnnualSalary(480000, false, false, false);
  assert.equal(result.months[6].pensionBase, 40000);
  assert.equal(result.months[7].pensionBase, 2600);
  assert.equal(result.months[8].pensionBase, 0);
  assert.equal(result.months[0].social, 5484);
  assert.equal(result.months[7].social, 1272.76);
  assert.equal(result.months[8].social, 980);
  assert.equal(result.annualEmployeeSocial, 43580.76);
  assert.equal(result.annualHealth, 39277.73);
  assert.equal(result.annualTax, 111094);
  assert.equal(result.annualUopNet, 286047.51);
  const atCap = calculateAnnualSalary(282600, false, false, false);
  const aboveCap = calculateAnnualSalary(294600, false, false, false);
  assert.ok(Math.abs(aboveCap.annualEmployeeSocial - atCap.annualEmployeeSocial - 294) < 0.02);
});

test("PPK employee cash deduction and taxable employer contributions are included annually", () => {
  const result = calculateAnnualSalary(480000, false, false, true);
  const without = calculateAnnualSalary(480000, false, false, false);
  assert.equal(result.annualEmployeePpk, 9600);
  assert.equal(result.annualEmployerPpk, 7200);
  assert.equal(result.annualTax, 113398);
  assert.equal(result.annualUopNet, 274143.51);
  assert.equal(without.annualUopNet - result.annualUopNet, 11904);
  // Employer contributions consume the youth exemption too.
  assert.ok(calculateAnnualSalary(85528, true, true, true).annualTaxBase > 0);
});

test("B2B annual settlement deducts social insurance and half health, but not Labour Fund", () => {
  const result = calculateAnnualSalary(120000, false, false, false);
  assert.equal(result.annualB2bSocial, 21459.48);
  assert.equal(result.annualB2bHealth, 9966.96);
  assert.equal(result.annualB2bTax, 11426);
  assert.equal(result.annualB2bNet, 77147.56);
  const high = calculateAnnualSalary(480000, false, false, false);
  assert.equal(high.annualB2bHealth, 17940.48);
  assert.equal(high.annualB2bTax, 54148);
  assert.equal(high.annualB2bNet, 386452.04);
  const reliefs = calculateAnnualSalary(120000, true, true, true);
  assert.equal(reliefs.annualB2bNet, result.annualB2bNet);
});

test("B2B health brackets use full-year revenue after deductible social contributions", () => {
  for (const [gross, tier] of [
    [79797.84, 0],
    [79797.85, 1],
    [319797.84, 1],
    [319797.85, 2],
  ]) {
    const result = calculateAnnualSalary(gross, false, false, false);
    assert.equal(result.healthTier, tier);
  }
});

test("yearly totals reconcile with monthly averages and the ledger, including remainder cents", () => {
  for (const annual of [0, 1, 85528, 120000, 500000, 500000.01]) {
    for (const [youth, kup, ppk] of [
      [false, false, false],
      [true, true, true],
    ]) {
      const result = calculateAnnualSalary(annual, youth, kup, ppk);
      const round = (value) => Math.round(value * 100) / 100;
      assert.equal(round(result.months.reduce((sum, row) => sum + row.gross, 0)), annual);
      assert.equal(round(result.uopNet * 12), result.annualUopNet);
      assert.equal(round(result.b2bNet * 12), result.annualB2bNet);
      assert.equal(
        round(
          result.annualGross -
            result.annualEmployeeSocial -
            result.annualHealth -
            result.annualEmployeePpk -
            result.annualTax,
        ),
        result.annualUopNet,
      );
      assert.equal(
        round(result.annualGross - result.annualB2bSocial - result.annualB2bHealth - result.annualB2bTax),
        result.annualB2bNet,
      );
      assert.deepEqual(calculateSalary(annual / 12, youth, kup, ppk), result);
    }
  }
});

test("equivalent salary uses the annual model in both directions", () => {
  const result = calculateSalary(40000, true, true, true);
  const b2b = findEquivalentAmount(result.uopNet, "b2b", true, true, true);
  const uop = findEquivalentAmount(result.b2bNet, "uop", true, true, true);
  assert.ok(Math.abs(calculateSalary(b2b, true, true, true).annualB2bNet - result.annualUopNet) <= 1);
  assert.ok(Math.abs(calculateSalary(uop, true, true, true).annualUopNet - result.annualB2bNet) <= 1);
});

test("B2B tax rounds its annual taxable base before rounding tax", () => {
  const result = calculateAnnualSalary(23792.43, false, false, false);
  assert.equal(result.annualB2bTaxBase, 1004);
  assert.equal(result.annualB2bTax, 120);
});
