export type PurchaseCostSettings = {
  agent: boolean;
  pcc: boolean;
  fixedFees: boolean;
  mortgageFee: boolean;
};
// Budget estimates for a resale apartment; actual supplier/bank quotes vary.
export const PURCHASE_COST_ASSUMPTIONS = {
  agentPercentIncludingVat: 3,
  vatPercent: 23,
  notary: 5000,
  inspection: 1500,
  valuation: 750,
  mortgageFeePercent: 2,
} as const;
export function calculatePurchaseCosts(
  price: number,
  downPayment: number,
  loan: number,
  settings: PurchaseCostSettings,
) {
  const money = (value: number) => Math.round(value * 100) / 100;
  const agent = settings.agent ? money(price * 0.03) : 0;
  const amounts = {
    agent,
    pcc: settings.pcc ? money(price * 0.02) : 0,
    fixedFees: settings.fixedFees
      ? PURCHASE_COST_ASSUMPTIONS.notary + PURCHASE_COST_ASSUMPTIONS.inspection + PURCHASE_COST_ASSUMPTIONS.valuation
      : 0,
    mortgageFee: settings.mortgageFee ? money((loan * PURCHASE_COST_ASSUMPTIONS.mortgageFeePercent) / 100) : 0,
  };
  const total = money(Object.values(amounts).reduce((sum, value) => sum + value, 0));
  return {
    amounts,
    agentVatIncluded: money((agent * 23) / 123),
    total,
    upfront: money(downPayment + total),
    purchaseTotal: money(price + total),
  };
}
