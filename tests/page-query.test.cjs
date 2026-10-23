const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/page-query.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

test("calculator query restores shareable inputs and preserves unrelated params", () => {
  const { parseCalculatorQuery, writeCalculatorQuery, defaultCalculatorState } = queryModule.exports;
  const state = parseCalculatorQuery(
    "?campaign=spring&tab=mortgage&amount=42000&youth=0&kup=1&ppk=0&loan=250000&rate=6.5&years=20",
  );

  assert.deepEqual(state, {
    tab: "mortgage",
    amount: 42000,
    youthRelief: false,
    copyrightKup: true,
    ppk: false,
    loan: 250000,
    propertyPrice: 312500,
    downPaymentPercent: 20,
    rate: 6.5,
    years: 20,
    monthlyOverpayment: 15000,
    overpaymentEnabled: true,
    overpaymentMode: "payment",
  });
  assert.match(writeCalculatorQuery("?campaign=spring", state), /campaign=spring/);
  assert.deepEqual(parseCalculatorQuery(`?${writeCalculatorQuery("", state)}`, "/mortgage/"), {
    ...defaultCalculatorState,
    tab: "mortgage",
    loan: state.loan,
    propertyPrice: state.propertyPrice,
    downPaymentPercent: state.downPaymentPercent,
    rate: state.rate,
    years: state.years,
  });
});

test("invalid calculator query values use defaults and valid ranges", () => {
  const { defaultCalculatorState, parseCalculatorQuery } = queryModule.exports;
  const state = parseCalculatorQuery("?tab=other&amount=NaN&youth=maybe&loan=9000000&rate=-1&years=0");

  assert.equal(state.tab, defaultCalculatorState.tab);
  assert.equal(state.amount, defaultCalculatorState.amount);
  assert.equal(state.youthRelief, defaultCalculatorState.youthRelief);
  assert.equal(state.loan, 5000000);
  assert.equal(state.rate, 0);
  assert.equal(state.years, 1);
});

test("tab paths override legacy query values and preserve deployment prefixes", () => {
  const { parseCalculatorQuery, writeCalculatorQuery, writeCalculatorPath, defaultCalculatorState } =
    queryModule.exports;
  assert.equal(parseCalculatorQuery("?tab=mortgage", "/salary/").tab, "salary");
  assert.equal(parseCalculatorQuery("", "/finly/mortgage/").tab, "mortgage");
  assert.equal(parseCalculatorQuery("", "/").tab, "salary");
  assert.equal(writeCalculatorPath("/", "salary"), "/salary");
  assert.equal(writeCalculatorPath("/finly/salary/", "mortgage"), "/finly/mortgage");
  assert.equal(writeCalculatorPath("/finly/", "salary"), "/finly/salary");
  const query = new URLSearchParams(writeCalculatorQuery("?tab=mortgage&campaign=test", defaultCalculatorState));
  assert.equal(query.has("tab"), false);
  assert.equal(query.get("campaign"), "test");
});

test("calculator paths stay slash-free when switching tabs", () => {
  const { writeCalculatorPath, parseCalculatorQuery } = queryModule.exports;
  assert.equal(writeCalculatorPath("/salary", "mortgage"), "/mortgage");
  assert.equal(parseCalculatorQuery("", "/mortgage").tab, "mortgage");
});

test("query contains only active calculator settings and the default rate is 6.5", () => {
  const { writeCalculatorQuery, parseCalculatorQuery, defaultCalculatorState } = queryModule.exports;
  assert.equal(parseCalculatorQuery("", "/mortgage").rate, 6.5);
  const original = "?amount=20000&youth=0&kup=0&ppk=0&loan=300000&rate=8&years=20&campaign=test";
  assert.deepEqual(Object.fromEntries(new URLSearchParams(writeCalculatorQuery(original, defaultCalculatorState))), {
    campaign: "test",
    amount: "15000",
    youth: "1",
    kup: "1",
    ppk: "1",
  });
  assert.deepEqual(
    Object.fromEntries(
      new URLSearchParams(writeCalculatorQuery(original, { ...defaultCalculatorState, tab: "mortgage" })),
    ),
    {
      campaign: "test",
      price: "150000",
      down: "20",
      rate: "6.5",
      years: "30",
      overpay: "15000",
      overpayOn: "1",
      mode: "payment",
    },
  );
});

test("mortgage price and down payment determine the loan and survive sharing", () => {
  const { parseCalculatorQuery, writeCalculatorQuery } = queryModule.exports;
  const defaults = parseCalculatorQuery("", "/mortgage");
  assert.equal(defaults.downPaymentPercent, 20);
  assert.equal(defaults.loan, 120000);
  const state = parseCalculatorQuery("?price=750000&down=10&campaign=test", "/mortgage");
  assert.equal(state.loan, 675000);
  assert.deepEqual(parseCalculatorQuery(writeCalculatorQuery("?campaign=test", state), "/mortgage"), state);
  assert.equal(parseCalculatorQuery("?price=500000&down=100").loan, 0);
  assert.equal(parseCalculatorQuery("?price=500000&down=-10").loan, 500000);
  assert.equal(parseCalculatorQuery("?price=500000&down=NaN").loan, 400000);
  assert.equal(parseCalculatorQuery("?price=0&down=20").loan, 0);
  assert.equal(parseCalculatorQuery("?price=500000&down=150").loan, 0);
  assert.equal(parseCalculatorQuery("?price=500000&down=20&loan=1").loan, 400000);
});

test("overpayment settings restore, validate and remain shareable", () => {
  const { parseCalculatorQuery, writeCalculatorQuery } = queryModule.exports;
  const state = parseCalculatorQuery("?price=1000000&down=30&overpay=1500&mode=duration", "/mortgage");
  assert.equal(state.monthlyOverpayment, 1500);
  assert.equal(state.overpaymentMode, "duration");
  assert.deepEqual(parseCalculatorQuery(writeCalculatorQuery("", state), "/mortgage"), state);
  const invalid = parseCalculatorQuery("?overpay=-1&mode=bad");
  assert.equal(invalid.monthlyOverpayment, 0);
  assert.equal(invalid.overpaymentMode, "payment");
});

test("default monthly overpayment is 15000 and an explicit zero is preserved", () => {
  const { parseCalculatorQuery } = queryModule.exports;
  assert.equal(parseCalculatorQuery("", "/mortgage").monthlyOverpayment, 15000);
  assert.equal(parseCalculatorQuery("?overpay=0", "/mortgage").monthlyOverpayment, 0);
});

test("overpayment checkbox defaults on and preserves the amount while disabled in shared links", () => {
  const { parseCalculatorQuery, writeCalculatorQuery } = queryModule.exports;
  assert.equal(parseCalculatorQuery("", "/mortgage").overpaymentEnabled, true);
  assert.equal(parseCalculatorQuery("?overpay=5000", "/mortgage").overpaymentEnabled, true);
  const state = parseCalculatorQuery("?overpay=25000&overpayOn=0", "/mortgage");
  assert.equal(state.overpaymentEnabled, false);
  assert.equal(state.monthlyOverpayment, 25000);
  assert.deepEqual(parseCalculatorQuery(writeCalculatorQuery("?lang=ru", state), "/mortgage"), state);
  const salary = writeCalculatorQuery("?overpayOn=0&lang=ru", { ...state, tab: "salary" });
  assert.equal(new URLSearchParams(salary).has("overpayOn"), false);
  assert.equal(new URLSearchParams(salary).get("lang"), "ru");
});

test("annual salary input survives shared URLs through the linked monthly amount", () => {
  const { defaultCalculatorState, writeCalculatorQuery, parseCalculatorQuery } = queryModule.exports;
  const annual = 500000.01;
  const query = writeCalculatorQuery("?lang=ru&campaign=annual", { ...defaultCalculatorState, amount: annual / 12 });
  const restored = parseCalculatorQuery(query, "/salary");
  assert.equal(Math.round(restored.amount * 1200) / 100, annual);
  assert.equal(new URLSearchParams(query).get("lang"), "ru");
  assert.equal(new URLSearchParams(query).get("campaign"), "annual");
});
