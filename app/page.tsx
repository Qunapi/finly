"use client";

import { useEffect, useState } from "react";
import { numberFormat, parseNumberInput } from "./lib/number-format";
import { fetchExchangeRates, type ExchangeRates } from "./lib/exchange-rates";
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
  const [tab, setTab] = useState<"salary" | "mortgage">("salary");
  const [amount, setAmount] = useState(15000);
  const [youthRelief, setYouthRelief] = useState(true);
  const [ppk, setPpk] = useState(true);
  const [copyrightKup, setCopyrightKup] = useState(true);
  const [queryLoaded, setQueryLoaded] = useState(false);
  const [propertyPrice, setPropertyPrice] = useState(defaultCalculatorState.propertyPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(defaultCalculatorState.downPaymentPercent);
  const downPayment = Math.round(propertyPrice * downPaymentPercent) / 100;
  const loan = Math.round((propertyPrice - downPayment) * 100) / 100;
  const [rate, setRate] = useState(defaultCalculatorState.rate);
  const [years, setYears] = useState(30);
  const [monthlyOverpayment, setMonthlyOverpayment] = useState(defaultCalculatorState.monthlyOverpayment);
  const [overpaymentMode, setOverpaymentMode] = useState<OverpaymentMode>("payment");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [ratesUnavailable, setRatesUnavailable] = useState(false);
  const result = calculateSalary(amount, youthRelief, copyrightKup, ppk);
  const mortgage = calculateMortgage(loan, rate, years, monthlyOverpayment, overpaymentMode);
  const baselineMortgage = calculateMortgage(loan, rate, years);
  const b2bEquivalent = findEquivalentAmount(result.uopNet, "b2b", youthRelief, copyrightKup, ppk);
  const uopEquivalent = findEquivalentAmount(result.b2bNet, "uop", youthRelief, copyrightKup, ppk);
  const better = result.b2bNet >= result.uopNet ? "B2B" : "UoP";
  const difference = Math.abs(result.b2bNet - result.uopNet);

  useEffect(() => {
    let active = true;
    fetchExchangeRates()
      .then((rates) => {
        if (active) setExchangeRates(rates);
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
      overpaymentMode,
    });
    window.history.replaceState(
      null,
      "",
      `${writeCalculatorPath(window.location.pathname, tab)}?${query}${window.location.hash}`,
    );
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
    overpaymentMode,
  ]);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          finly<span>.</span>
        </a>
        <span className="year">POLSKA · 2026</span>
      </header>
      <nav className="tabs" aria-label="Kalkulatory">
        <button className={tab === "salary" ? "active" : ""} onClick={() => setTab("salary")}>
          Wynagrodzenie
        </button>
        <button className={tab === "mortgage" ? "active" : ""} onClick={() => setTab("mortgage")}>
          Kredyt hipoteczny
        </button>
      </nav>
      {tab === "salary" ? (
        <>
          <section className="intro">
            <p className="eyebrow">KALKULATOR WYNAGRODZEŃ</p>
            <h1>
              Ile zostaje
              <br />
              na Twoim koncie?
            </h1>
            <p className="lede">Porównaj umowę o pracę z kontraktem B2B na ryczałcie 12%.</p>
          </section>

          <section className="calculator" aria-label="Porównanie wynagrodzeń">
            <div className="input-panel">
              <label htmlFor="amount">Miesięczne wynagrodzenie brutto / faktura netto</label>
              <div className="amount-input">
                <NumberInput id="amount" value={amount} onChange={setAmount} max={Number.MAX_SAFE_INTEGER} />
                <span>PLN</span>
              </div>
              <input
                aria-label="Wynagrodzenie"
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
              <div className="quick-amounts" aria-label="Szybki wybór wynagrodzenia">
                {quickAmounts.map((preset) => (
                  <button key={preset} type="button" aria-pressed={amount === preset} onClick={() => setAmount(preset)}>
                    {preset / 1000}k
                  </button>
                ))}
              </div>
              <div className="options">
                <label className="check-option">
                  <input
                    type="checkbox"
                    checked={youthRelief}
                    onChange={(event) => setYouthRelief(event.target.checked)}
                  />{" "}
                  Ulga dla młodych (do 26 lat)
                </label>
                <label className="check-option">
                  <input
                    type="checkbox"
                    checked={copyrightKup}
                    onChange={(event) => setCopyrightKup(event.target.checked)}
                  />{" "}
                  50% KUP · prawa autorskie
                </label>
                <small className="kup-note">
                  Dla kwalifikującego się honorarium; limit 120 000 zł rocznie wspólny z ulgą dla młodych.
                </small>
                <label className="check-option">
                  <input type="checkbox" checked={ppk} onChange={(event) => setPpk(event.target.checked)} /> PPK · 2%
                </label>
              </div>
              <div className="comparison-note">
                <span className="sparkle">✳</span>
                <span>
                  Przy tej kwocie więcej zostaje na <strong>{better}</strong>
                  <br />
                  różnica to <strong>{exactMoney.format(difference)}</strong> miesięcznie.
                </span>
              </div>
            </div>

            <div className="results">
              <article className="result-card uop">
                <div className="card-heading">
                  <span className="dot" />
                  <span>Umowa o pracę</span>
                  <span className="tag">UoP</span>
                </div>
                <p className="takehome">{exactMoney.format(result.uopNet)}</p>
                <p className="takehome-label">na rękę / miesiąc</p>
                <CurrencyEquivalent amount={result.uopNet} rates={exchangeRates} unavailable={ratesUnavailable} />
                <div className="divider" />
                <Breakdown label="Składki społeczne" value={result.employeeSocial} />
                <Breakdown label="Składka zdrowotna" value={result.health} />
                {ppk && <Breakdown label="PPK pracownika · 2%" value={result.employeePpk} />}
                <Breakdown label="Zaliczka na PIT" value={result.annualTax} />
                <p className="equivalent">
                  Taka sama kwota netto na B2B: <strong>{exactMoney.format(b2bEquivalent)} / mies.</strong>
                </p>
                <CurrencyEquivalent amount={b2bEquivalent} rates={exchangeRates} unavailable={ratesUnavailable} />
              </article>
              <article className="result-card b2b">
                <div className="card-heading">
                  <span className="dot" />
                  <span>B2B · ryczałt 12%</span>
                  <span className="tag">JDG</span>
                </div>
                <p className="takehome">{exactMoney.format(result.b2bNet)}</p>
                <p className="takehome-label">na rękę / miesiąc</p>
                <CurrencyEquivalent amount={result.b2bNet} rates={exchangeRates} unavailable={ratesUnavailable} />
                <p className="equivalent">
                  Pensja na UoP z takim samym netto: <strong>{exactMoney.format(uopEquivalent)} brutto / mies.</strong>
                </p>
                <CurrencyEquivalent amount={uopEquivalent} rates={exchangeRates} unavailable={ratesUnavailable} />
                <div className="divider" />
                <Breakdown label="ZUS społeczny · bez chorobowego" value={result.b2bSocial} />
                <Breakdown label="Składka zdrowotna" value={result.b2bHealth} />
                <Breakdown label="Ryczałt 12%" value={result.b2bTax} />
              </article>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="intro">
            <p className="eyebrow">KALKULATOR KREDYTU</p>
            <h1>
              Sprawdź ratę
              <br />
              swojego kredytu.
            </h1>
            <p className="lede">Zobacz miesięczną ratę i całkowity koszt kredytu.</p>
          </section>
          <section className="calculator mortgage-calculator" aria-label="Kalkulator kredytu hipotecznego">
            <div className="input-panel">
              <MoneyInput
                id="property-price"
                label="Cena mieszkania"
                value={propertyPrice}
                onChange={setPropertyPrice}
                max={6250000}
              />
              <div className="quick-amounts" aria-label="Szybki wybór ceny mieszkania">
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
                label="Wkład własny"
                value={Number(downPaymentPercent.toFixed(6))}
                onChange={setDownPaymentPercent}
                max={100}
                suffix="%"
              />
              <div className="quick-amounts" aria-label="Szybki wybór wkładu własnego">
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
                label="Wkład własny w złotych"
                value={downPayment}
                onChange={(value) => setDownPaymentPercent(propertyPrice ? (value / propertyPrice) * 100 : 0)}
                max={propertyPrice}
              />
              <div aria-live="polite">
                <Breakdown label="Kwota kredytu" value={loan} />
              </div>
              <MoneyInput
                id="rate"
                label="Oprocentowanie roczne"
                value={rate}
                onChange={(value) => setRate(Math.min(30, value))}
                max={30}
                suffix="%"
              />
              <label className="term-label" htmlFor="years">
                Okres spłaty
              </label>
              <div className="amount-input term-input">
                <NumberInput id="years" value={years} onChange={setYears} min={1} max={40} />
                <span>lat</span>
              </div>
              <MoneyInput
                id="overpayment"
                label="Nadpłata miesięczna"
                value={monthlyOverpayment}
                onChange={setMonthlyOverpayment}
                max={6250000}
              />
              <fieldset className="overpayment-options">
                <legend>Cel nadpłaty</legend>
                <label className="check-option">
                  <input
                    type="radio"
                    name="overpayment-mode"
                    checked={overpaymentMode === "payment"}
                    onChange={() => setOverpaymentMode("payment")}
                  />{" "}
                  Zmniejszenie raty
                </label>
                <label className="check-option">
                  <input
                    type="radio"
                    name="overpayment-mode"
                    checked={overpaymentMode === "duration"}
                    onChange={() => setOverpaymentMode("duration")}
                  />{" "}
                  Skrócenie okresu spłaty
                </label>
              </fieldset>
            </div>
            <article className="result-card mortgage-result">
              <p className="eyebrow">RATA MIESIĘCZNA</p>
              <p className="takehome mortgage-payment">{exactMoney.format(mortgage.payment)}</p>
              <div
                className="mortgage-meter"
                aria-label={`Kapitał ${Math.round((loan / (mortgage.total || 1)) * 100)}%, odsetki ${Math.round((mortgage.interest / (mortgage.total || 1)) * 100)}%`}
              >
                <span
                  className="principal-meter"
                  style={{ width: `${mortgage.total ? (loan / mortgage.total) * 100 : 0}%` }}
                />
                <span className="interest-meter" />
              </div>
              <Breakdown label="Pożyczony kapitał" value={loan} />
              <Breakdown label="Łączne odsetki" value={mortgage.interest} />
              <div className="divider" />
              <Breakdown label="Całkowita kwota do spłaty" value={mortgage.total} />
              <Breakdown
                label="Oszczędność na odsetkach"
                value={Math.max(0, baselineMortgage.interest - mortgage.interest)}
              />
              <p className="mortgage-footnote">
                Spłata w {mortgage.months} mies. · Rata powyżej dotyczy pierwszego miesiąca, bez nadpłaty. Nadpłata na
                koniec każdego miesiąca; oprocentowanie stałe w symulacji.
              </p>
              <p className="mortgage-footnote">Szacunek dla rat równych. Rzeczywista oferta banku może się różnić.</p>
            </article>
          </section>
          <section className="payment-schedule" aria-label="Harmonogram spłaty">
            <h2>Harmonogram spłaty</h2>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Tabela rat — przewijaj, aby zobaczyć wszystkie płatności"
            >
              <table>
                <caption>Raty i nadpłaty miesięczne w PLN</caption>
                <thead>
                  <tr>
                    <th scope="col">Miesiąc</th>
                    <th scope="col">Rata</th>
                    <th scope="col">Odsetki</th>
                    <th scope="col">Kapitał z nadpłatą</th>
                    <th scope="col">Nadpłata</th>
                    <th scope="col">Łączna płatność</th>
                    <th scope="col">Pozostało</th>
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
              {!mortgage.schedule.length && <p>Brak rat do spłaty.</p>}
            </div>
          </section>
        </>
      )}
      <footer>
        <span>Szacunek dla Polski · 2026</span>
        <span>
          {tab === "salary"
            ? exchangeRates
              ? `Kursy z ${exchangeRates.date} · B2B bez chorobowego i kosztów · ${ppk ? "PPK pracodawcy 1,5%." : "bez PPK."}`
              : ratesUnavailable
                ? `Kursy walut niedostępne · B2B bez chorobowego i kosztów · ${ppk ? "PPK pracodawcy 1,5%." : "bez PPK."}`
                : `Pobieram kursy walut · B2B bez chorobowego i kosztów · ${ppk ? "PPK pracodawcy 1,5%." : "bez PPK."}`
            : "Rata nie obejmuje prowizji ani ubezpieczeń."}
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
  if (!rates)
    return <p className="currency-equivalents">{unavailable ? "Kursy walut niedostępne" : "Pobieram kursy…"}</p>;
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
