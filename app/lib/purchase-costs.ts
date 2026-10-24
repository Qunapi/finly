export type PurchaseCostSettings = {
  agent: boolean;
  agentVat: boolean;
  pcc: boolean;
  notary: boolean;
  inspection: boolean;
  valuation: boolean;
  mortgageFee: boolean;
  notaryAmount: number;
  inspectionAmount: number;
  valuationAmount: number;
  mortgageFeePercent: number;
};
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
    agentVat: settings.agent && settings.agentVat ? money(agent * 0.23) : 0,
    pcc: settings.pcc ? money(price * 0.02) : 0,
    notary: settings.notary ? money(settings.notaryAmount) : 0,
    inspection: settings.inspection ? money(settings.inspectionAmount) : 0,
    valuation: settings.valuation ? money(settings.valuationAmount) : 0,
    mortgageFee: settings.mortgageFee ? money((loan * settings.mortgageFeePercent) / 100) : 0,
  };
  const total = money(Object.values(amounts).reduce((sum, value) => sum + value, 0));
  return { amounts, total, upfront: money(downPayment + total), purchaseTotal: money(price + total) };
}
