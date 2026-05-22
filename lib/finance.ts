/**
 * Pure financial calculations — kept dependency-free for easy testing.
 */

export interface AmortizationRow {
  installmentNo: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export function emi(principal: number, annualRatePct: number, tenureMonths: number): number {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  const f = Math.pow(1 + r, tenureMonths);
  return (principal * r * f) / (f - 1);
}

export function amortization(principal: number, annualRatePct: number, tenureMonths: number): AmortizationRow[] {
  const r = annualRatePct / 12 / 100;
  const e = emi(principal, annualRatePct, tenureMonths);
  const rows: AmortizationRow[] = [];
  let balance = principal;
  for (let i = 1; i <= tenureMonths; i++) {
    const interest = balance * r;
    const principalComp = e - interest;
    balance = Math.max(0, balance - principalComp);
    rows.push({ installmentNo: i, emi: e, principal: principalComp, interest, balance });
  }
  return rows;
}

/** Monthly required to hit a target by deadline, given current and assumed annual return. */
export function goalMonthlyRequired(
  current: number,
  target: number,
  months: number,
  annualReturnPct = 12,
): number {
  if (months <= 0) return Math.max(0, target - current);
  const r = annualReturnPct / 12 / 100;
  const fvCurrent = current * Math.pow(1 + r, months);
  const need = Math.max(0, target - fvCurrent);
  if (r === 0) return need / months;
  return (need * r) / (Math.pow(1 + r, months) - 1);
}

/**
 * FI corpus needed (Trinity-style): annual expenses / safe withdrawal rate.
 * Default SWR 4%, so multiplier 25x.
 */
export function fiCorpus(monthlyExpense: number, swrPct = 4): number {
  return (monthlyExpense * 12) / (swrPct / 100);
}
