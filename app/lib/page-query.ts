import type { PurchaseCostSettings } from "./purchase-costs";
import type { OverpaymentMode } from "./mortgage";

export type CalculatorState = {
  tab: "salary" | "mortgage";
  amount: number;
  purchaseCosts: PurchaseCostSettings;
  youthRelief: boolean;
  copyrightKup: boolean;
  ppk: boolean;
  loan: number;
  propertyPrice: number;
  downPaymentPercent: number;
  rate: number;
  years: number;
  monthlyOverpayment: number;
  overpaymentEnabled: boolean;
  overpaymentMode: OverpaymentMode;
};

export const defaultCalculatorState: CalculatorState = {
  tab: "salary",
  amount: 15000,
  purchaseCosts: {
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
  },
  youthRelief: true,
  copyrightKup: true,
  ppk: true,
  loan: 120000,
  propertyPrice: 150000,
  downPaymentPercent: 20,
  rate: 6.5,
  years: 30,
  monthlyOverpayment: 15000,
  overpaymentEnabled: true,
  overpaymentMode: "payment",
};

export function parseCalculatorQuery(search: string, pathname = ""): CalculatorState {
  const params = new URLSearchParams(search);
  const number = (key: string, fallback: number, min: number, max: number) => {
    const value = Number(params.get(key));
    return params.has(key) && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  };
  const boolean = (key: string, fallback: boolean) =>
    params.get(key) === "1" ? true : params.get(key) === "0" ? false : fallback;

  // Old shared links specify the loan directly; infer the price at 20% down.
  const propertyPrice = number(
    "price",
    params.has("loan")
      ? number("loan", defaultCalculatorState.loan, 0, 5000000) / 0.8
      : defaultCalculatorState.propertyPrice,
    0,
    6250000,
  );
  const downPaymentPercent = number("down", defaultCalculatorState.downPaymentPercent, 0, 100);

  return {
    tab: (pathname.match(/\/(salary|mortgage)\/?$/)?.[1] ?? params.get("tab")) === "mortgage" ? "mortgage" : "salary",
    purchaseCosts: {
      agent: boolean("feeAgent", true),
      agentVat: boolean("feeVat", true),
      pcc: boolean("feePcc", true),
      notary: boolean("feeNotary", true),
      inspection: boolean("feeInspect", true),
      valuation: boolean("feeValue", true),
      mortgageFee: boolean("feeBank", true),
      notaryAmount: number("notaryCost", 5000, 0, 6250000),
      inspectionAmount: number("inspectCost", 1500, 0, 6250000),
      valuationAmount: number("valueCost", 750, 0, 6250000),
      mortgageFeePercent: number("bankPercent", 2, 0, 10),
    },
    amount: number("amount", defaultCalculatorState.amount, 0, Number.MAX_SAFE_INTEGER),
    youthRelief: boolean("youth", defaultCalculatorState.youthRelief),
    copyrightKup: boolean("kup", defaultCalculatorState.copyrightKup),
    ppk: boolean("ppk", defaultCalculatorState.ppk),
    propertyPrice,
    downPaymentPercent,
    loan: Math.round(propertyPrice * (1 - downPaymentPercent / 100) * 100) / 100,
    rate: number("rate", defaultCalculatorState.rate, 0, 30),
    years: number("years", defaultCalculatorState.years, 1, 40),
    overpaymentEnabled: boolean("overpayOn", defaultCalculatorState.overpaymentEnabled),
    monthlyOverpayment: number("overpay", defaultCalculatorState.monthlyOverpayment, 0, 6250000),
    overpaymentMode: params.get("mode") === "duration" ? "duration" : "payment",
  };
}

const feeQueryKeys: Record<keyof PurchaseCostSettings, string> = {
  agent: "feeAgent",
  agentVat: "feeVat",
  pcc: "feePcc",
  notary: "feeNotary",
  inspection: "feeInspect",
  valuation: "feeValue",
  mortgageFee: "feeBank",
  notaryAmount: "notaryCost",
  inspectionAmount: "inspectCost",
  valuationAmount: "valueCost",
  mortgageFeePercent: "bankPercent",
};

export function writeCalculatorQuery(search: string, state: CalculatorState): string {
  const params = new URLSearchParams(search);
  params.delete("tab");
  for (const key of Object.values(feeQueryKeys)) params.delete(key);
  for (const key of [
    "amount",
    "youth",
    "kup",
    "ppk",
    "loan",
    "price",
    "down",
    "rate",
    "years",
    "overpay",
    "overpayOn",
    "mode",
  ])
    params.delete(key);
  if (state.tab === "salary") {
    params.set("amount", String(state.amount));
    params.set("youth", state.youthRelief ? "1" : "0");
    params.set("kup", state.copyrightKup ? "1" : "0");
    params.set("ppk", state.ppk ? "1" : "0");
  } else {
    params.set("price", String(state.propertyPrice));
    params.set("down", String(state.downPaymentPercent));
    params.set("rate", String(state.rate));
    params.set("years", String(state.years));
    params.set("overpay", String(state.monthlyOverpayment));
    params.set("overpayOn", state.overpaymentEnabled ? "1" : "0");
    params.set("mode", state.overpaymentMode);
    for (const key of Object.keys(feeQueryKeys) as (keyof PurchaseCostSettings)[]) {
      const value = state.purchaseCosts[key];
      if (value !== defaultCalculatorState.purchaseCosts[key])
        params.set(feeQueryKeys[key], typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    }
  }
  return params.toString();
}

export function writeCalculatorPath(pathname: string, tab: CalculatorState["tab"]): string {
  const base = pathname.replace(/\/(salary|mortgage)\/?$/, "").replace(/\/$/, "");
  return `${base}/${tab}`;
}
