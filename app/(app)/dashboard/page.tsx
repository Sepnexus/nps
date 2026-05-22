import { ArrowDownRight, ArrowUpRight, Target, TrendingUp, Wallet } from "lucide-react";
import { BreakdownChart } from "@/components/breakdown-chart";
import { CashflowChart } from "@/components/cashflow-chart";
import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { DEMO } from "@/lib/demo-data";
import { fiCorpus, goalMonthlyRequired } from "@/lib/finance";
import { dashboardMetrics, netWorth } from "@/lib/queries";
import { formatMoney, formatPct } from "@/lib/utils";

export default async function DashboardPage() {
  const [m, nw] = await Promise.all([dashboardMetrics(), netWorth()]);
  const usingReal = m.count > 0;
  const income = usingReal ? m.income : DEMO.income.total;
  const expense = usingReal ? m.expense : DEMO.expenses.total;
  const surplus = income - expense;
  const savingsRate = (surplus / income) * 100;
  const emiTotal = DEMO.expenses.emi1 + DEMO.expenses.emi2;
  const emiPct = (emiTotal / income) * 100;
  const fi = fiCorpus(expense);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {!usingReal && (
        <div className="rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          Showing illustrative numbers. Add some transactions and this will switch to your real data.
        </div>
      )}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="Net worth"
          value={formatMoney(nw.net)}
          delta={`Assets ${formatMoney(nw.assets, { compact: true })} · Liab ${formatMoney(nw.liabilities, { compact: true })}`}
          deltaPositive={nw.net >= 0}
          icon={<Wallet className="size-4 text-[hsl(var(--chart-savings))]" />}
        />
        <Kpi
          title="Monthly Income"
          value={formatMoney(income)}
          delta={usingReal ? `${m.count} transactions this month` : "demo"}
          deltaPositive
          icon={<ArrowUpRight className="size-4 text-[hsl(var(--chart-income))]" />}
        />
        <Kpi
          title="Monthly Expense"
          value={formatMoney(expense)}
          delta={usingReal ? "this month so far" : "demo"}
          deltaPositive
          icon={<ArrowDownRight className="size-4 text-[hsl(var(--chart-expense))]" />}
        />
        <Kpi
          title="Surplus / Savings Rate"
          value={formatMoney(surplus)}
          delta={formatPct(savingsRate, 0) + " saved"}
          deltaPositive
          icon={<Wallet className="size-4 text-[hsl(var(--chart-savings))]" />}
        />
        <Kpi
          title="EMI % of Income"
          value={formatPct(emiPct, 1)}
          delta={emiPct < 30 ? "Healthy" : "Watch"}
          deltaPositive={emiPct < 30}
          icon={<TrendingUp className="size-4 text-[hsl(var(--chart-debt))]" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cash flow — last 6 months</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <Legend color="hsl(var(--chart-income))" label="Income" />
                <Legend color="hsl(var(--chart-expense))" label="Expense" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CashflowChart data={DEMO.monthlyHistory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where money goes</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownChart data={DEMO.expenseBreakdown} />
            <ul className="mt-3 space-y-1.5 text-xs">
              {DEMO.expenseBreakdown.map((b) => (
                <li key={b.name} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{b.name}</span>
                  <span className="tabular">{formatMoney(b.value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <CardTitle>Goals</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEMO.goals.map((g) => {
              const pct = Math.min(100, (g.current / g.target) * 100);
              const need = goalMonthlyRequired(g.current, g.target, g.monthsTo);
              return (
                <div key={g.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground tabular">
                      {formatMoney(g.current, { compact: true })} / {formatMoney(g.target, { compact: true })}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct.toFixed(1)}% complete</span>
                    <span className="tabular">
                      Needs ~{formatMoney(need, { compact: true })}/mo for {g.monthsTo} mo
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Independence projection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Monthly expense (current)" value={formatMoney(expense)} />
            <Row label="Annual expense" value={formatMoney(expense * 12)} />
            <Row label="FI corpus (25× rule)" value={formatMoney(fi)} strong />
            <Row label="Investments today (est.)" value={formatMoney(DEMO.investments.estimatedCurrentValue)} />
            <Row label="Current SIP" value={`${formatMoney(DEMO.investments.sipMonthly)}/mo`} />
            <div className="pt-2 text-xs text-muted-foreground border-t">
              At a 12% expected annual return, your current SIP would need to rise to roughly{" "}
              <span className="text-foreground font-medium tabular">
                {formatMoney(goalMonthlyRequired(DEMO.investments.estimatedCurrentValue, fi, 12 * 12))}/mo
              </span>{" "}
              to hit FI in 12 years. After your ₹20k EMI ends, this is comfortably reachable.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  title,
  value,
  delta,
  deltaPositive,
  icon,
}: {
  title: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <CardValue>{value}</CardValue>
        {delta && (
          <p className={"mt-1 text-xs " + (deltaPositive ? "text-[hsl(var(--chart-income))]" : "text-[hsl(var(--chart-expense))]")}>
            {delta}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={"tabular " + (strong ? "font-semibold text-base" : "")}>{value}</span>
    </div>
  );
}
