export function calculateMortgage(principal: number, annualRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualRate / 1200;
  const payment =
    !months || !principal
      ? 0
      : monthlyRate
        ? (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
        : principal / months;
  const total = payment * months;
  return { payment, total, interest: total - principal };
}
