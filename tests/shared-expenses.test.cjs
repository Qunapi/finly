const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/shared-expenses.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

const { settleExpenses, parseSharedExpenses, emptySharedExpenses } = queryModule.exports;
const people = ["Alice", "Bob", "Chris"].map((name, i) => ({ id: String(i), name }));
const expense = (id, cents, payer, participants) => ({ id, description: "Dinner", cents, payer, participants });
test("equal split preserves every cent and transfers settle all balances", () => {
  const data = { people, expenses: [expense("a", 10000, "0", ["0", "1", "2"]), expense("b", 6000, "1", ["0", "1"])] };
  const result = settleExpenses(data);
  assert.equal(result.total, 16000);
  assert.deepEqual(
    result.balances.map((p) => p.share),
    [6334, 6333, 3333],
  );
  assert.equal(
    result.balances.reduce((s, p) => s + p.balance, 0),
    0,
  );
  const remaining = new Map(result.balances.map((p) => [p.id, p.balance]));
  for (const transfer of result.transfers) {
    assert.ok(transfer.cents > 0);
    remaining.set(transfer.from, remaining.get(transfer.from) + transfer.cents);
    remaining.set(transfer.to, remaining.get(transfer.to) - transfer.cents);
  }
  assert.deepEqual([...remaining.values()], [0, 0, 0]);
});
test("payer can pay only for other people; uninvolved people owe nothing", () => {
  const result = settleExpenses({ people, expenses: [expense("a", 5000, "0", ["1"])] });
  assert.deepEqual(
    result.balances.map((p) => p.balance),
    [5000, -5000, 0],
  );
  assert.deepEqual(result.transfers, [{ from: "1", to: "0", cents: 5000 }]);
});
test("zero and fully balanced expenses need no transfers", () => {
  assert.deepEqual(settleExpenses(emptySharedExpenses).transfers, []);
  assert.deepEqual(
    settleExpenses({
      people,
      expenses: [
        expense("a", 300, "0", ["0", "1", "2"]),
        expense("b", 300, "1", ["0", "1", "2"]),
        expense("c", 300, "2", ["0", "1", "2"]),
      ],
    }).transfers,
    [],
  );
});
test("shared URL data round trips Unicode and rejects malformed or unsafe values", () => {
  const data = {
    people: [
      { id: "0", name: "Łukasz" },
      { id: "1", name: "Анна" },
    ],
    expenses: [expense("a", 12345, "0", ["0", "1"])],
  };
  const params = new URLSearchParams({ bills: JSON.stringify(data) });
  assert.deepEqual(parseSharedExpenses(new URLSearchParams(params.toString()).get("bills")), data);
  for (const value of [
    null,
    "",
    "null",
    "{",
    "{}",
    JSON.stringify({ ...data, people: [data.people[0], data.people[0]] }),
    ...[
      { cents: -1 },
      { cents: 1.5 },
      { cents: 1e20 },
      { payer: "missing" },
      { participants: [] },
      { participants: ["0", "0"] },
      { participants: ["missing"] },
      { description: "" },
    ].map((change) => JSON.stringify({ ...data, expenses: [{ ...data.expenses[0], ...change }] })),
  ])
    assert.deepEqual(parseSharedExpenses(value), emptySharedExpenses);
});
test("deleting and editing an expense recomputes balances without stale debt", () => {
  const first = { people, expenses: [expense("a", 9000, "0", ["0", "1", "2"])] };
  assert.equal(settleExpenses(first).balances[0].balance, 6000);
  assert.equal(
    settleExpenses({ ...first, expenses: [expense("a", 9000, "1", ["0", "1"])] }).balances[0].balance,
    -4500,
  );
  assert.deepEqual(
    settleExpenses({ people, expenses: [] }).balances.map((p) => p.balance),
    [0, 0, 0],
  );
});

test("local storage restores saved expenses while URL snapshots take priority", () => {
  const { restoreSharedExpenses, saveSharedExpenses, sharedExpensesStorageKey } = queryModule.exports;
  const data = { people, expenses: [expense("a", 10000, "0", ["0", "1"])] };
  const values = new Map();
  const storage = () => ({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  saveSharedExpenses(data, storage);
  assert.deepEqual(JSON.parse(values.get(sharedExpensesStorageKey)), data);
  assert.deepEqual(restoreSharedExpenses("?lang=en", storage), data);
  const shared = { people: [people[1]], expenses: [] };
  assert.deepEqual(
    restoreSharedExpenses("?" + new URLSearchParams({ bills: JSON.stringify(shared) }), storage),
    shared,
  );
  assert.deepEqual(
    restoreSharedExpenses("?bills=" + encodeURIComponent(JSON.stringify(emptySharedExpenses)), storage),
    emptySharedExpenses,
  );
  assert.deepEqual(restoreSharedExpenses("?bills=invalid", storage), emptySharedExpenses);
  saveSharedExpenses(emptySharedExpenses, storage);
  assert.deepEqual(restoreSharedExpenses("", storage), emptySharedExpenses);
});

test("missing, corrupt, blocked and full local storage never breaks shared expenses", () => {
  const { restoreSharedExpenses, saveSharedExpenses } = queryModule.exports;
  for (const storage of [
    () => ({ getItem: () => null }),
    () => ({ getItem: () => "broken" }),
    () => {
      throw new Error("SecurityError");
    },
  ]) {
    assert.deepEqual(restoreSharedExpenses("", storage), emptySharedExpenses);
  }
  const blocked = () => {
    throw new Error("SecurityError");
  };
  assert.doesNotThrow(() => saveSharedExpenses(emptySharedExpenses, blocked));
  assert.doesNotThrow(() =>
    saveSharedExpenses(emptySharedExpenses, () => ({
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    })),
  );
  const data = { people, expenses: [] };
  assert.deepEqual(restoreSharedExpenses("?" + new URLSearchParams({ bills: JSON.stringify(data) }), blocked), data);
});

test("compressed share links restore Unicode data and reject broken payloads", () => {
  const { encodeSharedExpenses, restoreSharedExpenses } = queryModule.exports;
  const data = {
    people: [{ id: "p", name: "Łukasz" }],
    expenses: [{ ...expense("e", 1234, "p", ["p"]), description: "Śniadanie 🍳" }],
  };
  const search = new URLSearchParams({ bills: encodeSharedExpenses(data) }).toString();
  assert.ok(search.length < new URLSearchParams({ bills: JSON.stringify(data) }).toString().length);
  const storage = () => {
    throw new Error("Shared links don't need storage");
  };
  assert.deepEqual(restoreSharedExpenses(search, storage), {
    people: [{ id: "0", name: "Łukasz" }],
    expenses: [{ ...data.expenses[0], id: "0", payer: "0", participants: ["0"] }],
  });
  const { compressToEncodedURIComponent } = require("lz-string");
  const legacy = new URLSearchParams({ bills: "1." + compressToEncodedURIComponent(JSON.stringify(data)) });
  assert.deepEqual(restoreSharedExpenses(legacy.toString(), storage), data);
  assert.match(new URLSearchParams(search).get("bills"), /^3\.[A-Za-z0-9_-]+$/);
  const compact = [["Łukasz"], [["Śniadanie 🍳", 1234, 0, [0]]]];
  const legacyCompact = "2." + compressToEncodedURIComponent(JSON.stringify(compact));
  assert.deepEqual(parseSharedExpenses(legacyCompact), restoreSharedExpenses(search, storage));
  assert.deepEqual(parseSharedExpenses("3.!"), emptySharedExpenses);
  const invalid = new URLSearchParams({
    bills: "2." + compressToEncodedURIComponent(JSON.stringify([["Łukasz"], [["Dinner", 1234, 2, [0]]]])),
  });
  assert.deepEqual(restoreSharedExpenses(invalid.toString(), storage), emptySharedExpenses);
  assert.deepEqual(restoreSharedExpenses("bills=1.invalid", storage), emptySharedExpenses);
});
