export type ExchangeRates = { EUR: number; USD: number; date: string };
type RateRow = { quote: string; date: string; rate: number };

function isRateRow(row: unknown): row is RateRow {
  return (
    typeof row === "object" &&
    row !== null &&
    "quote" in row &&
    typeof row.quote === "string" &&
    "date" in row &&
    typeof row.date === "string" &&
    "rate" in row &&
    typeof row.rate === "number" &&
    Number.isFinite(row.rate) &&
    row.rate > 0
  );
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const query = new URLSearchParams({ base: "PLN", quotes: "EUR,USD" });
  const response = await fetch(`https://api.frankfurter.dev/v2/rates?${query}`);
  if (!response.ok) throw new Error("Exchange rates are unavailable");

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Invalid exchange rates response");
  const eur = rows.find((row: unknown): row is RateRow => isRateRow(row) && row.quote === "EUR");
  const usd = rows.find((row: unknown): row is RateRow => isRateRow(row) && row.quote === "USD");
  if (!eur || !usd || !/^\d{4}-\d{2}-\d{2}$/.test(eur.date) || !/^\d{4}-\d{2}-\d{2}$/.test(usd.date)) {
    throw new Error("Invalid exchange rates response");
  }

  const dates = [...new Set([eur.date, usd.date])].sort();
  return { EUR: eur.rate, USD: usd.rate, date: dates.join(" – ") };
}

const CACHE_KEY = "finly-exchange-rates";
export function readCachedExchangeRates(storage: Pick<Storage, "getItem">): ExchangeRates | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(CACHE_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const rates = value as ExchangeRates;
    return Number.isFinite(rates.EUR) &&
      rates.EUR > 0 &&
      Number.isFinite(rates.USD) &&
      rates.USD > 0 &&
      typeof rates.date === "string" &&
      /^\d{4}-\d{2}-\d{2}( – \d{4}-\d{2}-\d{2})?$/.test(rates.date)
      ? rates
      : null;
  } catch {
    return null;
  }
}
export function cacheExchangeRates(storage: Pick<Storage, "setItem">, rates: ExchangeRates): void {
  storage.setItem(CACHE_KEY, JSON.stringify(rates));
}
