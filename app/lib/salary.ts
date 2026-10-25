// 2026 Polish annual estimate, one employer and twelve months of equal earnings.
// Rules: https://www.podatki.gov.pl/pit/ and https://www.zus.pl/baza-wiedzy/skladki-wskazniki-odsetki
export const SALARY_RULES_2026 = {
  youthExemption: 85528,
  combinedYouthAndCopyrightLimit: 120000,
  pensionContributionCap: 282600,
  taxThreshold: 120000,
  taxReduction: 3600,
  standardAnnualCosts: 3000,
  b2bDeductibleSocialMonthly: 1649.82,
  b2bLabourFundMonthly: 138.47,
  b2bHealthMonthly: [498.35, 830.58, 1495.04],
} as const;

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function annualIncomeTax(taxableIncome: number) {
  const base = Math.max(0, Math.round(taxableIncome));
  const { taxThreshold, taxReduction } = SALARY_RULES_2026;
  return Math.round(
    Math.max(0, Math.min(base, taxThreshold) * 0.12 + Math.max(0, base - taxThreshold) * 0.32 - taxReduction),
  );
}

function calculateSalaryEstimate(
  annualAmount: number,
  youthRelief: boolean,
  copyrightKup: boolean,
  ppk: boolean,
  withMonthlySchedule: boolean,
) {
  const rules = SALARY_RULES_2026;
  const annualGross = money(Math.max(0, Number.isFinite(annualAmount) ? annualAmount : 0));
  const annualCents = Math.round(annualGross * 100);
  let pensionBaseUsed = 0;
  let exemptIncome = 0;
  let taxableSocial = 0;
  let taxableCopyrightIncome = 0;
  let annualEmployeeSocial = 0;
  let annualHealth = 0;
  let annualEmployeePpk = 0;
  let annualEmployerPpk = 0;
  const months = [];
  for (let month = 0; month < 12; month++) {
    // Allocate remainder cents so the monthly ledger sums exactly to the yearly input.
    const gross = (Math.floor(annualCents / 12) + (month < annualCents % 12 ? 1 : 0)) / 100;
    const pensionBase = Math.min(gross, Math.max(0, rules.pensionContributionCap - pensionBaseUsed));
    pensionBaseUsed += pensionBase;
    const social = money(money(pensionBase * 0.0976) + money(pensionBase * 0.015) + money(gross * 0.0245));
    const health = money((gross - social) * 0.09);
    const employeePpk = ppk ? money(gross * 0.02) : 0;
    const employerPpk = ppk ? money(gross * 0.015) : 0;
    const income = money(gross + employerPpk);
    const exempt = youthRelief ? Math.min(income, Math.max(0, rules.youthExemption - exemptIncome)) : 0;
    const taxableRatio = income > 0 ? (income - exempt) / income : 0;
    const deductibleSocial = money(social * taxableRatio);
    exemptIncome = money(exemptIncome + exempt);
    taxableSocial = money(taxableSocial + deductibleSocial);
    // Employer PPK is taxable income, but is not copyright remuneration.
    taxableCopyrightIncome += Math.max(0, gross * taxableRatio - deductibleSocial);
    annualEmployeeSocial = money(annualEmployeeSocial + social);
    annualHealth = money(annualHealth + health);
    annualEmployeePpk = money(annualEmployeePpk + employeePpk);
    annualEmployerPpk = money(annualEmployerPpk + employerPpk);
    months.push({
      month: month + 1,
      gross,
      social,
      health,
      employeePpk,
      employerPpk,
      exemptIncome: exempt,
      pensionBase,
      taxableIncome: money(income - exempt),
      deductibleSocial,
      copyrightIncome: Math.max(0, gross * taxableRatio - deductibleSocial),
    });
  }
  const taxableIncome = Math.max(0, annualGross + annualEmployerPpk - exemptIncome);
  const annualCopyrightCosts = copyrightKup
    ? money(Math.min(taxableCopyrightIncome * 0.5, Math.max(0, rules.combinedYouthAndCopyrightLimit - exemptIncome)))
    : 0;
  const annualCosts = copyrightKup
    ? annualCopyrightCosts
    : Math.min(rules.standardAnnualCosts, Math.max(0, taxableIncome - taxableSocial));
  const annualTaxBase = Math.max(0, Math.round(taxableIncome - taxableSocial - annualCosts));
  const annualTax = annualIncomeTax(annualTaxBase);
  const annualUopNet = money(annualGross - annualEmployeeSocial - annualHealth - annualEmployeePpk - annualTax);

  // Full-year established business, standard ZUS, no voluntary sickness insurance or expenses.
  // Labour Fund is paid but is not deductible from revenue under ryczalt.
  const annualB2bDeductibleSocial = money(rules.b2bDeductibleSocialMonthly * 12);
  const annualB2bSocial = money((rules.b2bDeductibleSocialMonthly + rules.b2bLabourFundMonthly) * 12);
  const healthRevenue = Math.max(0, annualGross - annualB2bDeductibleSocial);
  const healthTier = healthRevenue <= 60000 ? 0 : healthRevenue <= 300000 ? 1 : 2;
  const annualB2bHealth = money(rules.b2bHealthMonthly[healthTier] * 12);
  const annualB2bTaxBase = Math.round(Math.max(0, annualGross - annualB2bDeductibleSocial - annualB2bHealth * 0.5));
  const annualB2bTax = Math.round(annualB2bTaxBase * 0.12);
  const annualB2bNet = money(annualGross - annualB2bSocial - annualB2bHealth - annualB2bTax);
  let copyrightIncomeUsed = 0;
  let copyrightCostsUsed = 0;
  let cumulativeTaxBase = 0;
  let annualTaxAdvances = 0;
  let annualUopPaid = 0;
  let cumulativeB2bRevenue = 0;
  let cumulativeB2bSocial = 0;
  let annualB2bHealthPaid = 0;
  let annualB2bTaxPaid = 0;
  let annualB2bPaid = 0;
  const salaryMonths = withMonthlySchedule
    ? months.map((row) => {
        copyrightIncomeUsed += row.copyrightIncome;
        const copyrightTarget = Math.min(annualCopyrightCosts, money(copyrightIncomeUsed * 0.5));
        const costs = copyrightKup
          ? money(copyrightTarget - copyrightCostsUsed)
          : Math.min(250, money(Math.max(0, row.taxableIncome - row.deductibleSocial)));
        copyrightCostsUsed = copyrightTarget;
        const taxBase = Math.max(0, Math.round(row.taxableIncome - row.deductibleSocial - costs));
        const baseAt12 = Math.min(taxBase, Math.max(0, rules.taxThreshold - cumulativeTaxBase));
        const baseAt32 = taxBase - baseAt12;
        cumulativeTaxBase += taxBase;
        // One employer, PIT-2 filed: use a 300 PLN reduction each month, not
        // an accumulated 30000 PLN annual allowance deferred until later months.
        const taxAdvance = Math.round(Math.max(0, baseAt12 * 0.12 + baseAt32 * 0.32 - rules.taxReduction / 12));
        const uopNet = money(row.gross - row.social - row.health - row.employeePpk - taxAdvance);
        annualTaxAdvances += taxAdvance;
        annualUopPaid = money(annualUopPaid + uopNet);

        cumulativeB2bRevenue = money(cumulativeB2bRevenue + row.gross);
        cumulativeB2bSocial = money(cumulativeB2bSocial + rules.b2bDeductibleSocialMonthly);
        const b2bHealthRevenue = Math.max(0, money(cumulativeB2bRevenue - cumulativeB2bSocial));
        const b2bHealthTier = b2bHealthRevenue <= 60000 ? 0 : b2bHealthRevenue <= 300000 ? 1 : 2;
        const b2bHealth = rules.b2bHealthMonthly[b2bHealthTier];
        annualB2bHealthPaid = money(annualB2bHealthPaid + b2bHealth);
        const b2bTaxBase = Math.round(
          Math.max(0, cumulativeB2bRevenue - cumulativeB2bSocial - annualB2bHealthPaid * 0.5),
        );
        const cumulativeB2bTax = Math.round(b2bTaxBase * 0.12);
        const b2bTax = Math.max(0, cumulativeB2bTax - annualB2bTaxPaid);
        annualB2bTaxPaid += b2bTax;
        const b2bSocial = money(rules.b2bDeductibleSocialMonthly + rules.b2bLabourFundMonthly);
        const b2bNet = money(row.gross - b2bSocial - b2bHealth - b2bTax);
        annualB2bPaid = money(annualB2bPaid + b2bNet);
        return {
          ...row,
          costs,
          taxBase,
          cumulativeTaxBase,
          baseAt12,
          baseAt32,
          taxAdvance,
          uopNet,
          b2bSocial,
          b2bHealth,
          b2bHealthRevenue,
          b2bHealthTier,
          b2bTax,
          b2bNet,
        };
      })
    : [];
  const uopSettlement = money(annualUopNet - annualUopPaid);
  const b2bSettlement = money(annualB2bNet - annualB2bPaid);
  return {
    annualGross,
    annualUopNet,
    annualB2bNet,
    annualEmployeeSocial,
    annualHealth,
    annualEmployeePpk,
    annualEmployerPpk,
    annualTax,
    annualTaxBase,
    annualCosts,
    annualCopyrightCosts,
    exemptIncome,
    taxableSocial,
    annualB2bSocial,
    annualB2bHealth,
    annualB2bTax,
    annualB2bTaxBase,
    healthRevenue,
    healthTier,
    months: salaryMonths,
    annualTaxAdvances,
    annualUopPaid,
    uopSettlement,
    annualB2bHealthPaid,
    annualB2bTaxPaid,
    annualB2bPaid,
    b2bSettlement,
    uopNet: annualUopNet / 12,
    b2bNet: annualB2bNet / 12,
    employeeSocial: annualEmployeeSocial / 12,
    health: annualHealth / 12,
    employeePpk: annualEmployeePpk / 12,
    employerPpk: annualEmployerPpk / 12,
    monthlyTax: annualTax / 12,
    b2bSocial: annualB2bSocial / 12,
    b2bHealth: annualB2bHealth / 12,
    b2bTax: annualB2bTax / 12,
  };
}

export function calculateAnnualSalary(annualAmount: number, youthRelief: boolean, copyrightKup: boolean, ppk = true) {
  return calculateSalaryEstimate(annualAmount, youthRelief, copyrightKup, ppk, true);
}

export function calculateSalary(amount: number, youthRelief: boolean, copyrightKup: boolean, ppk = true) {
  return calculateAnnualSalary(amount * 12, youthRelief, copyrightKup, ppk);
}

export function findEquivalentAmount(
  targetNet: number,
  contract: "uop" | "b2b",
  youthRelief: boolean,
  copyrightKup: boolean,
  ppk = true,
) {
  const upper = Math.max(30000, targetNet * 8 + 10000);
  const ranges =
    contract === "b2b"
      ? [
          [0, 5000 + SALARY_RULES_2026.b2bDeductibleSocialMonthly],
          [
            5000 + SALARY_RULES_2026.b2bDeductibleSocialMonthly + 0.01,
            25000 + SALARY_RULES_2026.b2bDeductibleSocialMonthly,
          ],
          [25000 + SALARY_RULES_2026.b2bDeductibleSocialMonthly + 0.01, upper],
        ]
      : [[0, upper]];
  let closest = 0;
  let smallestDifference = Infinity;

  for (const [start, end] of ranges) {
    let low = start;
    let high = end;
    for (let i = 0; i < 60; i++) {
      const middle = (low + high) / 2;
      const result = calculateSalaryEstimate(middle * 12, youthRelief, copyrightKup, ppk, false);
      const net = contract === "uop" ? result.uopNet : result.b2bNet;
      if (net < targetNet) low = middle;
      else high = middle;
    }

    for (const amount of [start, low, high, end]) {
      const result = calculateSalaryEstimate(amount * 12, youthRelief, copyrightKup, ppk, false);
      const net = contract === "uop" ? result.uopNet : result.b2bNet;
      const difference = Math.abs(net - targetNet);
      if (difference < smallestDifference) {
        closest = amount;
        smallestDifference = difference;
      }
    }
  }

  return closest;
}
