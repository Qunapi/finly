"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./components/language-provider";
import { numberFormat, parseNumberInput } from "./lib/number-format";
import {
  fetchExchangeRates,
  readCachedExchangeRates,
  cacheExchangeRates,
  type ExchangeRates,
} from "./lib/exchange-rates";
import { calculateSalary, findEquivalentAmount } from "./lib/salary";
import { calculateMortgage, type OverpaymentMode } from "./lib/mortgage";
import {
  defaultCalculatorState,
  parseCalculatorQuery,
  writeCalculatorQuery,
  writeCalculatorPath,
} from "./lib/page-query";

const exactMoney = new Intl.NumberFormat("pl-PL", {
  useGrouping: "always",
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
});
const dollars = new Intl.NumberFormat("pl-PL", {
  useGrouping: "always",
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const euros = new Intl.NumberFormat("pl-PL", {
  useGrouping: "always",
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});
const quickAmounts = [20000, 25000, 30000, 40000, 50000, 60000];
export default function Home() {
  const { t, language, ready: languageReady, setLanguage } = useLanguage();
  const [tab, setTab] = useState<"salary" | "mortgage">("salary");
  const [amount, setAmount] = useState(15000);
  const [youthRelief, setYouthRelief] = useState(true);
  const [ppk, setPpk] = useState(true);
  const [copyrightKup, setCopyrightKup] = useState(true);
  const [queryLoaded, setQueryLoaded] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [propertyPrice, setPropertyPrice] = useState(defaultCalculatorState.propertyPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(defaultCalculatorState.downPaymentPercent);
  const downPayment = Math.round(propertyPrice * downPaymentPercent) / 100;
  const loan = Math.round((propertyPrice - downPayment) * 100) / 100;
  const [rate, setRate] = useState(defaultCalculatorState.rate);
  const [years, setYears] = useState(30);
  const [monthlyOverpayment, setMonthlyOverpayment] = useState(defaultCalculatorState.monthlyOverpayment);
  const [overpaymentEnabled, setOverpaymentEnabled] = useState(defaultCalculatorState.overpaymentEnabled);
  const [overpaymentMode, setOverpaymentMode] = useState<OverpaymentMode>("payment");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [ratesUnavailable, setRatesUnavailable] = useState(false);
  const result = calculateSalary(amount, youthRelief, copyrightKup, ppk);
  const mortgage = calculateMortgage(loan, rate, years, overpaymentEnabled ? monthlyOverpayment : 0, overpaymentMode);
  const baselineMortgage = calculateMortgage(loan, rate, years);
  const b2bEquivalent = findEquivalentAmount(result.uopNet, "b2b", youthRelief, copyrightKup, ppk);
  const uopEquivalent = findEquivalentAmount(result.b2bNet, "uop", youthRelief, copyrightKup, ppk);
  const better = result.b2bNet >= result.uopNet ? "B2B" : "UoP";
  const difference = Math.abs(result.b2bNet - result.uopNet);

  useEffect(() => {
    let active = true;
    try {
      const cached = readCachedExchangeRates(localStorage);
      if (cached) setExchangeRates(cached);
    } catch {}
    fetchExchangeRates()
      .then((rates) => {
        if (active) {
          setExchangeRates(rates);
          try {
            cacheExchangeRates(localStorage, rates);
          } catch {}
        }
      })
      .catch(() => {
        if (active) setRatesUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const state = parseCalculatorQuery(window.location.search, window.location.pathname);
    setTab(state.tab);
    setAmount(state.amount);
    setYouthRelief(state.youthRelief);
    setCopyrightKup(state.copyrightKup);
    setPpk(state.ppk);
    setPropertyPrice(state.propertyPrice);
    setDownPaymentPercent(state.downPaymentPercent);
    setRate(state.rate);
    setYears(state.years);
    setMonthlyOverpayment(state.monthlyOverpayment);
    setOverpaymentEnabled(state.overpaymentEnabled);
    setOverpaymentMode(state.overpaymentMode);
    setQueryLoaded(true);
  }, []);

  useEffect(() => {
    if (!queryLoaded) return;
    const query = writeCalculatorQuery(window.location.search, {
      tab,
      amount,
      youthRelief,
      copyrightKup,
      ppk,
      loan,
      propertyPrice,
      downPaymentPercent,
      rate,
      years,
      monthlyOverpayment,
      overpaymentEnabled,
      overpaymentMode,
    });
    const next = `${writeCalculatorPath(window.location.pathname, tab)}?${query}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", next);
    }
  }, [
    queryLoaded,
    tab,
    amount,
    youthRelief,
    copyrightKup,
    ppk,
    loan,
    propertyPrice,
    downPaymentPercent,
    rate,
    years,
    monthlyOverpayment,
    overpaymentEnabled,
    overpaymentMode,
  ]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setFontsReady(true);
    }, 1500);
    const fonts = document.fonts;
    const loaded = fonts
      ? Promise.allSettled([fonts.load('400 16px "DM Sans"', "Aą"), fonts.load("700 16px Manrope", "AąЯ")])
      : Promise.resolve();
    loaded.then(() => {
      if (active) {
        window.clearTimeout(timer);
        setFontsReady(true);
      }
    });
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (!queryLoaded || !languageReady || !fontsReady)
    return (
      <main className="shell startup-shell" aria-busy="true" aria-label="Finly">
        <header className="topbar">
          <span className="brand">
            finly<span>.</span>
          </span>
        </header>
        <div className="startup-placeholder" aria-hidden="true">
          <div />
          <div />
          <div />
        </div>
      </main>
    );

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          finly<span>.</span>
        </a>
        <div className="header-settings">
          <span className="year">{t("POLSKA · 2026")}</span>
          <select
            aria-label={t("Język")}
            value={language}
            onChange={(event) => setLanguage(event.target.value as "pl" | "en" | "ru")}
          >
            <option value="pl" lang="pl">
              Polski
            </option>
            <option value="en" lang="en">
              English
            </option>
            <option value="ru" lang="ru">
              Русский
            </option>
          </select>
        </div>
      </header>
      <nav className="tabs" aria-label={t("Kalkulatory")}>
        <button className={tab === "salary" ? "active" : ""} onClick={() => setTab("salary")}>
          {t("Wynagrodzenie")}
        </button>
        <button className={tab === "mortgage" ? "active" : ""} onClick={() => setTab("mortgage")}>
          {t("Kredyt hipoteczny")}
        </button>
      </nav>
      {tab === "salary" ? (
        <>
          <section className="intro">
            <p className="eyebrow">{t("KALKULATOR WYNAGRODZEŃ")}</p>
            <h1>
              {t("Ile zostaje")}
              <br />
              {t("na Twoim koncie?")}
            </h1>
            <p className="lede">{t("Porównaj umowę o pracę z kontraktem B2B na ryczałcie 12%.")}</p>
          </section>

          <section className="calculator" aria-label={t("Porównanie wynagrodzeń")}>
            <div className="input-panel">
              <label htmlFor="amount">{t("Miesięczne wynagrodzenie brutto / faktura netto")}</label>
              <div className="amount-input">
                <NumberInput
                  id="amount"
                  value={Math.round(amount * 100) / 100}
                  onChange={setAmount}
                  max={Number.MAX_SAFE_INTEGER}
                />
                <span>PLN</span>
              </div>
              <CurrencyEquivalent amount={amount} rates={exchangeRates} unavailable={ratesUnavailable} />
              <input
                aria-label={t("Wynagrodzenie")}
                className="range"
                type="range"
                min="3000"
                max="60000"
                step="100"
                value={Math.min(60000, Math.max(3000, amount))}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
              <div className="range-labels">
                <span>3 000 zł</span>
                <span>60 000 zł</span>
              </div>
              <div className="quick-amounts" aria-label={t("Szybki wybór wynagrodzenia")}>
                {quickAmounts.map((preset) => (
                  <button key={preset} type="button" aria-pressed={amount === preset} onClick={() => setAmount(preset)}>
                    {preset / 1000}k
                  </button>
                ))}
              </div>
              <div className="annual-salary-input">
                <label htmlFor="annual-amount">{t("Roczne wynagrodzenie brutto / przychód bez VAT")}</label>
                <div className="amount-input">
                  <NumberInput
                    id="annual-amount"
                    value={Math.round(amount * 1200) / 100}
                    onChange={(value) => setAmount(value / 12)}
                    max={Number.MAX_SAFE_INTEGER}
                  />
                  <span>PLN</span>
                </div>
              </div>
              <div className="quick-amounts" aria-label={t("Szybki wybór rocznego wynagrodzenia")}>
                {Array.from({ length: 10 }, (_, index) => (index + 1) * 100000).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={Math.round(amount * 1200) / 100 === preset}
                    onClick={() => setAmount(preset / 12)}
                  >
                    {preset === 1000000 ? "1kk" : `${preset / 1000}k`}
                  </button>
                ))}
              </div>
              <p className="salary-assumptions">
                {t(
                  "Stałe zarobki przez 12 miesięcy. Wyniki miesięczne to średnia roczna — wypłaty w trakcie roku mogą się różnić po wykorzystaniu ulg i limitów.",
                )}
              </p>
              <div className="options">
                <label className="check-option">
                  <input
                    type="checkbox"
                    checked={youthRelief}
                    onChange={(event) => setYouthRelief(event.target.checked)}
                  />{" "}
                  {t("Ulga dla młodych (do 26 lat)")}
                </label>
                <label className="check-option">
                  <input
                    type="checkbox"
                    checked={copyrightKup}
                    onChange={(event) => setCopyrightKup(event.target.checked)}
                  />{" "}
                  {t("50% KUP · prawa autorskie")}
                </label>
                <small className="kup-note">
                  {t("Dla kwalifikującego się honorarium; limit 120 000 zł rocznie wspólny z ulgą dla młodych.")}{" "}
                  {t(
                    "Model zakłada 100% kwalifikowanego honorarium przy 50% KUP i prawo do ulgi dla młodych przez cały rok.",
                  )}
                </small>
                <label className="check-option">
                  <input type="checkbox" checked={ppk} onChange={(event) => setPpk(event.target.checked)} /> PPK · 2%
                </label>
              </div>
              <div className="comparison-note">
                <span className="sparkle">✳</span>
                <span>
                  {t("Przy tej kwocie więcej zostaje na")} <strong>{better}</strong>
                  <br />
                  {t("różnica to")} <strong>{exactMoney.format(difference)}</strong> {t("miesięcznie.")}
                </span>
              </div>
            </div>

            <div className="results">
              <article className="result-card uop">
                <div className="card-heading">
                  <span className="dot" />
                  <span>{t("Umowa o pracę")}</span>
                  <span className="tag">UoP</span>
                </div>
                <p className="takehome">{exactMoney.format(result.uopNet)}</p>
                <p className="takehome-label">{t("Średnio na rękę / miesiąc")}</p>
                <CurrencyEquivalent amount={result.uopNet} rates={exchangeRates} unavailable={ratesUnavailable} />
                <div className="annual-result">
                  <Breakdown label={t("Na rękę / rok")} value={result.annualUopNet} />
                  <Breakdown label={t("Brutto / przychód rocznie")} value={result.annualGross} />
                </div>
                <div className="divider" />
                <Breakdown label={t("Składki społeczne")} value={result.employeeSocial} />
                <Breakdown label={t("Składka zdrowotna")} value={result.health} />
                {ppk && <Breakdown label={t("PPK pracownika · 2%")} value={result.employeePpk} />}
                <Breakdown label={t("PIT · średnio miesięcznie")} value={result.monthlyTax} />
                <p className="equivalent">
                  {t("Taka sama kwota netto na B2B:")}{" "}
                  <strong>
                    {exactMoney.format(b2bEquivalent)} {t("/ mies.")}
                  </strong>
                </p>
                <CurrencyEquivalent amount={b2bEquivalent} rates={exchangeRates} unavailable={ratesUnavailable} />
              </article>
              <article className="result-card b2b">
                <div className="card-heading">
                  <span className="dot" />
                  <span>{t("B2B · ryczałt 12%")}</span>
                  <span className="tag">JDG</span>
                </div>
                <p className="takehome">{exactMoney.format(result.b2bNet)}</p>
                <p className="takehome-label">{t("Średnio na rękę / miesiąc")}</p>
                <CurrencyEquivalent amount={result.b2bNet} rates={exchangeRates} unavailable={ratesUnavailable} />
                <div className="annual-result">
                  <Breakdown label={t("Na rękę / rok")} value={result.annualB2bNet} />
                  <Breakdown label={t("Brutto / przychód rocznie")} value={result.annualGross} />
                </div>
                <p className="equivalent">
                  {t("Pensja na UoP z takim samym netto:")}{" "}
                  <strong>
                    {exactMoney.format(uopEquivalent)} {t("brutto / mies.")}
                  </strong>
                </p>
                <CurrencyEquivalent amount={uopEquivalent} rates={exchangeRates} unavailable={ratesUnavailable} />
                <div className="divider" />
                <Breakdown label={t("ZUS społeczny · bez chorobowego")} value={result.b2bSocial} />
                <Breakdown label={t("Składka zdrowotna")} value={result.b2bHealth} />
                <Breakdown label={t("Ryczałt 12%")} value={result.b2bTax} />
              </article>
            </div>
          </section>
          <p className="salary-assumptions">
            {t(
              "UoP: PIT 12%/32%, próg 120 000 zł, kwota wolna 30 000 zł, ulga dla młodych do 85 528 zł, limit składek emerytalno-rentowych 282 600 zł. Bez 50% KUP: koszty 3 000 zł rocznie. B2B: pełny rok działalności, standardowy ZUS, bez chorobowego i kosztów; składka zdrowotna po rozliczeniu rocznym. Założenia na 2026 r.; inne dochody i ulgi nie są uwzględniane.",
            )}
          </p>
        </>
      ) : (
        <>
          <section className="intro">
            <p className="eyebrow">{t("KALKULATOR KREDYTU")}</p>
            <h1>
              {t("Sprawdź ratę")}
              <br />
              {t("swojego kredytu.")}
            </h1>
            <p className="lede">{t("Zobacz miesięczną ratę i całkowity koszt kredytu.")}</p>
          </section>
          <section className="calculator mortgage-calculator" aria-label={t("Kalkulator kredytu hipotecznego")}>
            <div className="input-panel">
              <MoneyInput
                id="property-price"
                label={t("Cena mieszkania")}
                value={propertyPrice}
                onChange={setPropertyPrice}
                max={6250000}
              />
              <div className="quick-amounts" aria-label={t("Szybki wybór ceny mieszkania")}>
                {[1200000, 1000000, 800000, 1500000, 1600000, 1700000, 2000000].map((price) => (
                  <button
                    key={price}
                    type="button"
                    aria-pressed={propertyPrice === price}
                    onClick={() => setPropertyPrice(price)}
                  >
                    {numberFormat.format(price)}
                  </button>
                ))}
              </div>
              <MoneyInput
                id="down-payment"
                label={t("Wkład własny")}
                value={Number(downPaymentPercent.toFixed(6))}
                onChange={setDownPaymentPercent}
                max={100}
                suffix="%"
              />
              <div className="quick-amounts" aria-label={t("Szybki wybór wkładu własnego")}>
                {[10, 20, 30, 40].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    aria-pressed={downPaymentPercent === percent}
                    onClick={() => setDownPaymentPercent(percent)}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
              <MoneyInput
                id="down-payment-amount"
                label={t("Wkład własny w złotych")}
                value={downPayment}
                onChange={(value) => setDownPaymentPercent(propertyPrice ? (value / propertyPrice) * 100 : 0)}
                max={propertyPrice}
              />
              <div aria-live="polite">
                <Breakdown label={t("Kwota kredytu")} value={loan} />
              </div>
              <MoneyInput
                id="rate"
                label={t("Oprocentowanie roczne")}
                value={rate}
                onChange={(value) => setRate(Math.min(30, value))}
                max={30}
                suffix="%"
              />
              <label className="term-label" htmlFor="years">
                {t("Okres spłaty")}
              </label>
              <div className="amount-input term-input">
                <NumberInput id="years" value={years} onChange={setYears} min={1} max={40} />
                <span>{t("lat")}</span>
              </div>
              <label className="check-option overpayment-toggle">
                <input
                  id="overpayment-enabled"
                  type="checkbox"
                  checked={overpaymentEnabled}
                  onChange={(event) => setOverpaymentEnabled(event.target.checked)}
                />
                {t("Uwzględnij nadpłaty")}
              </label>
              <fieldset className="overpayment-fields" disabled={!overpaymentEnabled}>
                <legend className="sr-only">{t("Nadpłata miesięczna")}</legend>
                <MoneyInput
                  id="overpayment"
                  label={t("Nadpłata w pierwszym miesiącu")}
                  value={monthlyOverpayment}
                  onChange={setMonthlyOverpayment}
                  max={6250000}
                />
                <div className="quick-amounts" aria-label={t("Szybki wybór nadpłaty")}>
                  {[0, 5000, 10000, 15000, 20000, 25000, 30000].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={monthlyOverpayment === value}
                      onClick={() => setMonthlyOverpayment(value)}
                    >
                      {value === 0 ? "0" : `${value / 1000}k`}
                    </button>
                  ))}
                </div>
                <fieldset className="overpayment-options">
                  <legend>{t("Cel nadpłaty")}</legend>
                  <label className="check-option">
                    <input
                      type="radio"
                      name="overpayment-mode"
                      checked={overpaymentMode === "payment"}
                      onChange={() => setOverpaymentMode("payment")}
                    />{" "}
                    {t("Zmniejszenie raty")}
                  </label>
                  <label className="check-option">
                    <input
                      type="radio"
                      name="overpayment-mode"
                      checked={overpaymentMode === "duration"}
                      onChange={() => setOverpaymentMode("duration")}
                    />{" "}
                    {t("Skrócenie okresu spłaty")}
                  </label>
                </fieldset>
              </fieldset>
            </div>
            <article className="result-card mortgage-result">
              <p className="eyebrow">{t("RATA MIESIĘCZNA")}</p>
              <p className="takehome mortgage-payment">{exactMoney.format(mortgage.payment)}</p>
              <Breakdown label={t("Stała płatność miesięczna")} value={mortgage.monthlyBudget} />
              <p className="mortgage-footnote">
                {t(
                  "Stała suma raty i nadpłaty. Gdy rata maleje, nadpłata rośnie. Obie strategie dają ten sam termin spłaty i odsetki; ostatnia płatność może być niższa.",
                )}
              </p>
              <div
                className="mortgage-meter"
                aria-label={`${t("Kapitał")} ${Math.round((loan / (mortgage.total || 1)) * 100)}%, ${t("odsetki")} ${Math.round((mortgage.interest / (mortgage.total || 1)) * 100)}%`}
              >
                <span
                  className="principal-meter"
                  style={{ width: `${mortgage.total ? (loan / mortgage.total) * 100 : 0}%` }}
                />
                <span className="interest-meter" />
              </div>
              <Breakdown label={t("Pożyczony kapitał")} value={loan} />
              <Breakdown label={t("Łączne odsetki")} value={mortgage.interest} />
              <div className="divider" />
              <Breakdown label={t("Całkowita kwota do spłaty")} value={mortgage.total} />
              <Breakdown
                label={t("Oszczędność na odsetkach")}
                value={Math.max(0, baselineMortgage.interest - mortgage.interest)}
              />
              <p className="mortgage-footnote">
                {t(
                  "Spłata w {months} mies. · Rata powyżej dotyczy pierwszego miesiąca, bez nadpłaty. Nadpłata na koniec każdego miesiąca; oprocentowanie stałe w symulacji.",
                  { months: mortgage.months },
                )}
              </p>
              <p className="mortgage-footnote">
                {t("Szacunek dla rat równych. Rzeczywista oferta banku może się różnić.")}
              </p>
            </article>
          </section>
          <section className="payment-schedule" aria-label={t("Harmonogram spłaty")}>
            <h2>{t("Harmonogram spłaty")}</h2>
            <p className="lede" aria-live="polite">
              {t("Łączny okres spłaty:")}{" "}
              <strong>
                {mortgage.months} {t("mies.")}
              </strong>{" "}
              (
              {t("{years} lat i {months} mies.", {
                years: Math.floor(mortgage.months / 12),
                months: mortgage.months % 12,
              })}
              )
            </p>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={t("Tabela rat — przewijaj, aby zobaczyć wszystkie płatności")}
            >
              <table>
                <caption>{t("Raty i nadpłaty miesięczne w PLN")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("Miesiąc")}</th>
                    <th scope="col">{t("Rata")}</th>
                    <th scope="col">{t("Odsetki")}</th>
                    <th scope="col">{t("Kapitał z nadpłatą")}</th>
                    <th scope="col">{t("Nadpłata")}</th>
                    <th scope="col">{t("Łączna płatność")}</th>
                    <th scope="col">{t("Pozostało")}</th>
                  </tr>
                </thead>
                <tbody>
                  {mortgage.schedule.map((row) => (
                    <tr key={row.month}>
                      <th scope="row">{row.month}</th>
                      {[row.payment, row.interest, row.principal, row.overpayment, row.total, row.balance].map(
                        (value, index) => (
                          <td key={index}>{exactMoney.format(value)}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!mortgage.schedule.length && <p>{t("Brak rat do spłaty.")}</p>}
            </div>
          </section>
        </>
      )}
      <footer>
        <span>{t("Szacunek dla Polski · 2026")}</span>
        <span>
          {tab === "salary" ? (
            <>
              {exchangeRates
                ? t("Kursy z {date}", { date: exchangeRates.date })
                : ratesUnavailable
                  ? t("Kursy walut niedostępne")
                  : t("Pobieram kursy walut")}
              {" · "}
              {t("B2B bez chorobowego i kosztów")}
              {" · "}
              {t(ppk ? "PPK pracodawcy 1,5%." : "bez PPK.")}
            </>
          ) : (
            t("Rata nie obejmuje prowizji ani ubezpieczeń.")
          )}
        </span>
      </footer>
    </main>
  );
}

function CurrencyEquivalent({
  amount,
  rates,
  unavailable,
}: {
  amount: number;
  rates: ExchangeRates | null;
  unavailable: boolean;
}) {
  const { t } = useLanguage();
  if (!rates)
    return <p className="currency-equivalents">{unavailable ? t("Kursy walut niedostępne") : t("Pobieram kursy…")}</p>;
  return (
    <p className="currency-equivalents">
      {dollars.format(amount * rates.USD)} <span>·</span> {euros.format(amount * rates.EUR)}
    </p>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div className="breakdown">
      <span>{label}</span>
      <strong>{exactMoney.format(value)}</strong>
    </div>
  );
}

function MoneyInput({
  id,
  label,
  value,
  onChange,
  suffix = "PLN",
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  max: number;
}) {
  return (
    <div className="mortgage-field">
      <label htmlFor={id}>{label}</label>
      <div className="amount-input">
        <NumberInput id={id} value={value} onChange={onChange} max={max} />
        <span>{suffix}</span>
      </div>
    </div>
  );
}

function NumberInput({
  id,
  value,
  onChange,
  min = 0,
  max,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
}) {
  // Keep a draft while editing so decimal separators, deletion and the caret behave naturally.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={draft ?? numberFormat.format(value)}
      onFocus={() => setDraft(numberFormat.format(value))}
      onChange={(event) => {
        const text = event.target.value;
        const parsed = parseNumberInput(text);
        if (parsed === null) return;
        setDraft(text);
        onChange(Math.min(max, Math.max(min, parsed)));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
