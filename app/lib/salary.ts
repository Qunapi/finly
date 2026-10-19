export function calculateSalary(amount: number, youthRelief: boolean, copyrightKup: boolean, ppk = true) {
  const gross = Math.max(0, amount);
  // shortcut: models a representative month without the annual ZUS cap; model payroll periods if cap timing matters.
  const annualEmployeeSocial = gross * 12 * 0.1371;
  const employeeSocial = annualEmployeeSocial / 12;
  const health = (gross - employeeSocial) * 0.09;
  const employeePpk = ppk ? gross * 0.02 : 0;
  const employerPpk = ppk ? gross * 0.015 : 0;
  const annualGross = (gross + employerPpk) * 12;
  const exemptIncome = youthRelief ? Math.min(annualGross, 85528) : 0;
  const taxableIncome = annualGross - exemptIncome;
  const taxableSocial = gross > 0 ? annualEmployeeSocial * (taxableIncome / annualGross) : 0;
  const annualCopyrightKup = copyrightKup
    ? Math.min(Math.max(0, (gross * 12 - exemptIncome - taxableSocial) / 2), Math.max(0, 120000 - exemptIncome))
    : 0;
  const annualTaxBase = Math.max(0, taxableIncome - taxableSocial - annualCopyrightKup);
  const monthlyTax = Math.round(Math.max(0, annualTaxBase / 12) * 0.12);
  const uopNet = gross - employeeSocial - health - monthlyTax - employeePpk;

  const b2bSocial = 1788.29;
  const annualRevenue = gross * 12;
  const b2bHealth = annualRevenue <= 60000 ? 498.35 : annualRevenue <= 300000 ? 830.58 : 1495.04;
  const b2bTax = Math.max(0, (annualRevenue - b2bSocial * 12 - b2bHealth * 6) * 0.12) / 12;
  const b2bNet = Math.max(0, gross - b2bSocial - b2bHealth - b2bTax);

  return {
    uopNet,
    employeeSocial,
    health,
    employeePpk,
    employerPpk,
    annualTax: monthlyTax,
    b2bNet,
    b2bSocial,
    b2bHealth,
    b2bTax,
  };
}

export function findEquivalentAmount(
  targetNet: number,
  contract: "uop" | "b2b",
  youthRelief: boolean,
  copyrightKup: boolean,
  ppk = true,
) {
  const upper = Math.max(30000, targetNet * 4 + 10000);
  const ranges =
    contract === "b2b"
      ? [
          [0, 5000],
          [5000.01, 25000],
          [25000.01, upper],
        ]
      : [[0, upper]];
  let closest = 0;
  let smallestDifference = Infinity;

  for (const [start, end] of ranges) {
    let low = start;
    let high = end;
    for (let i = 0; i < 60; i++) {
      const middle = (low + high) / 2;
      const result = calculateSalary(middle, youthRelief, copyrightKup, ppk);
      const net = contract === "uop" ? result.uopNet : result.b2bNet;
      if (net < targetNet) low = middle;
      else high = middle;
    }

    for (const amount of [start, low, high, end]) {
      const result = calculateSalary(amount, youthRelief, copyrightKup, ppk);
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
