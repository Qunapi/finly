export type CalculatorState = {
  tab: "salary" | "mortgage";
  amount: number;
  youthRelief: boolean;
  copyrightKup: boolean;
  ppk: boolean;
  loan: number;
  rate: number;
  years: number;
};

export const defaultCalculatorState: CalculatorState = {
  tab: "salary",
  amount: 15000,
  youthRelief: true,
  copyrightKup: true,
  ppk: true,
  loan: 400000,
  rate: 6.5,
  years: 30,
};

export function parseCalculatorQuery(search: string, pathname = ""): CalculatorState {
  const params = new URLSearchParams(search);
  const number = (key: string, fallback: number, min: number, max: number) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  };
  const boolean = (key: string, fallback: boolean) =>
    params.get(key) === "1" ? true : params.get(key) === "0" ? false : fallback;

  return {
    tab: (pathname.match(/\/(salary|mortgage)\/?$/)?.[1] ?? params.get("tab")) === "mortgage" ? "mortgage" : "salary",
    amount: number("amount", defaultCalculatorState.amount, 0, Number.MAX_SAFE_INTEGER),
    youthRelief: boolean("youth", defaultCalculatorState.youthRelief),
    copyrightKup: boolean("kup", defaultCalculatorState.copyrightKup),
    ppk: boolean("ppk", defaultCalculatorState.ppk),
    loan: number("loan", defaultCalculatorState.loan, 0, 5000000),
    rate: number("rate", defaultCalculatorState.rate, 0, 30),
    years: number("years", defaultCalculatorState.years, 1, 40),
  };
}

export function writeCalculatorQuery(search: string, state: CalculatorState): string {
  const params = new URLSearchParams(search);
  params.delete("tab");
  for (const key of ["amount", "youth", "kup", "ppk", "loan", "rate", "years"]) params.delete(key);
  if (state.tab === "salary") {
    params.set("amount", String(state.amount));
    params.set("youth", state.youthRelief ? "1" : "0");
    params.set("kup", state.copyrightKup ? "1" : "0");
    params.set("ppk", state.ppk ? "1" : "0");
  } else {
    params.set("loan", String(state.loan));
    params.set("rate", String(state.rate));
    params.set("years", String(state.years));
  }
  return params.toString();
}

export function writeCalculatorPath(pathname: string, tab: CalculatorState["tab"]): string {
  const base = pathname.replace(/\/(salary|mortgage)\/?$/, "").replace(/\/$/, "");
  return `${base}/${tab}`;
}
