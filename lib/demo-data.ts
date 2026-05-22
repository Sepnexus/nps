/**
 * Placeholder demo numbers from your real conversation. Replace once
 * transactions are flowing in. Used only when the DB has no data yet.
 */

export const DEMO = {
  income: {
    salary: 113_000,
    weekly: 100_000, // ₹25k × 4
    other: 10_000,
    total: 223_000,
  },
  expenses: {
    emi1: 37_000,
    emi2: 20_000,
    family: 30_000,
    rentFood: 15_000,
    insurance: 3_000,
    investments: 20_000,
    lifestyleMisc: 30_000,
    total: 155_000,
  },
  loans: [
    { name: "Personal Loan A", outstanding: 380_000, emi: 37_000, rate: 11.5, monthsLeft: 12 },
    { name: "Personal Loan B", outstanding: 95_000, emi: 20_000, rate: 13.0, monthsLeft: 6 },
  ],
  investments: {
    sipMonthly: 20_000,
    estimatedCurrentValue: 250_000,
  },
  emergencyFund: { current: 80_000, target: 800_000 },
  goals: [
    { name: "Emergency Fund", target: 800_000, current: 80_000, monthsTo: 12 },
    { name: "Financial Independence", target: 30_000_000, current: 250_000, monthsTo: 10 * 12 },
  ],
  monthlyHistory: [
    { month: "Dec", income: 215_000, expense: 158_000 },
    { month: "Jan", income: 220_000, expense: 152_000 },
    { month: "Feb", income: 218_000, expense: 161_000 },
    { month: "Mar", income: 225_000, expense: 155_000 },
    { month: "Apr", income: 223_000, expense: 149_000 },
    { month: "May", income: 223_000, expense: 155_000 },
  ],
  expenseBreakdown: [
    { name: "EMIs", value: 57_000 },
    { name: "Family", value: 30_000 },
    { name: "Rent/Food", value: 15_000 },
    { name: "Investments", value: 20_000 },
    { name: "Lifestyle", value: 30_000 },
    { name: "Insurance", value: 3_000 },
  ],
};
