export type OverpaymentMode = "payment" | "duration";

function monthlyPayment(principal: number, monthlyRate: number, months: number) {
  if (!months || !principal) return 0;
  return monthlyRate ? (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months) : principal / months;
}

export function calculateMortgage(
  principal: number,
  annualRate: number,
  years: number,
  monthlyOverpayment = 0,
  mode: OverpaymentMode = "payment",
) {
  const months = Math.max(0, Math.round(years * 12));
  const monthlyRate = annualRate / 1200;
  const payment = monthlyPayment(principal, monthlyRate, months);
  const cents = (value: number) => Math.round(value * 100);
  let balance = cents(principal);
  const extra = Math.max(0, cents(monthlyOverpayment));
  const monthlyBudget = balance > 0 ? cents(payment) + extra : 0;
  const schedule = [];
  let totalCents = 0;
  let interestCents = 0;
  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = Math.round(balance * monthlyRate);
    const regularPayment =
      mode === "payment" && extra > 0
        ? cents(monthlyPayment(balance / 100, monthlyRate, months - month + 1))
        : cents(payment);
    const installment = month === months ? balance + interest : Math.min(balance + interest, regularPayment);
    // Reinvest every reduction of the required installment into the overpayment.
    // Both strategies therefore use the same total monthly budget until the final payment.
    const overpayment =
      extra > 0 ? Math.min(Math.max(0, monthlyBudget - installment), Math.max(0, balance + interest - installment)) : 0;
    const paidPrincipal = installment - interest + overpayment;
    balance = Math.max(0, balance - paidPrincipal);
    totalCents += installment + overpayment;
    interestCents += interest;
    schedule.push({
      month,
      payment: installment / 100,
      interest: interest / 100,
      principal: paidPrincipal / 100,
      overpayment: overpayment / 100,
      total: (installment + overpayment) / 100,
      balance: balance / 100,
    });
  }
  return {
    payment,
    monthlyBudget: monthlyBudget / 100,
    total: totalCents / 100,
    interest: interestCents / 100,
    months: schedule.length,
    schedule,
  };
}
