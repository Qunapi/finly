const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../app/lib/language.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const queryModule = new Module(filename, module);
queryModule.filename = filename;
queryModule.paths = Module._nodeModulePaths(path.dirname(filename));
queryModule._compile(compiled.outputText, filename);

test("language selection prioritizes URL, saved choice and browser preferences", () => {
  const { chooseLanguage } = queryModule.exports;
  assert.equal(chooseLanguage("ru", "pl", ["en-US"]), "ru");
  assert.equal(chooseLanguage(null, "ru", ["pl-PL"]), "ru");
  assert.equal(chooseLanguage(null, null, ["ru-RU", "en"]), "ru");
  assert.equal(chooseLanguage(null, null, ["en-GB", "pl"]), "en");
  assert.equal(chooseLanguage(null, null, ["pl-PL"]), "pl");
  assert.equal(chooseLanguage("xx", "xx", ["de-DE", "ru_RU"]), "ru");
  assert.equal(chooseLanguage(null, null, ["fr-FR"]), "en");
  assert.equal(chooseLanguage(null, null, []), "en");
});
test("translations cover salary, mortgage and PWA text including placeholders", () => {
  const { translate } = queryModule.exports;
  assert.equal(translate("en", "Cena mieszkania"), "Apartment price");
  assert.equal(translate("ru", "Cena mieszkania"), "Стоимость квартиры");
  assert.equal(translate("pl", "Cena mieszkania"), "Cena mieszkania");
  assert.equal(translate("en", "{years} lat i {months} mies.", { years: 10, months: 5 }), "10 years and 5 months");
  assert.equal(translate("ru", "Aktualizuj teraz"), "Обновить сейчас");
  assert.equal(translate("en", "Pensja na UoP z takim samym netto:"), "Employment salary for the same take-home pay:");
});
