import { ArrowDownRight, ArrowUpRight, Target, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { BreakdownChart } from "@/components/breakdown-chart";
import { CashflowChart } from "@/components/cashflow-chart";
import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { fiCorpus, goalMonthlyRequired } from "@/lib/finance";
import {
  dashboardMetrics,
  expenseBreakdown,
  investmentTotals,
  listGoals,
  monthlyHistory,
  netWorth,
  totalMonthlyEmi,
} from "@/lib/queries";
import { formatMoney, formatPct } from "@/lib/utils";

function monthsUntil(date: string | null) {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

export default async function DashboardPage() {
  const [m, nw, history, breakdown, emiTotal, inv, goals] = await Promise.all([
    dashboardMetrics(),
    netWorth(),
    monthlyHistory(6),
    expenseBreakdown(8),
    totalMonthlyEmi(),
    investmentTotals(),
    listGoals(),
  ]);

  const income = m.income;
  const expense = m.expense;
  const surplus = income - expense;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;
  const emiPct = income > 0 ? (emiTotal / income) * 100 : 0;
  const fi = expense > 0 ? fiCorpus(expense) : 0;

  const hasAnyData = m.count > 0 || nw.assets > 0 || emiTotal > 0 || inv.invested > 0 || goals.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {!hasAnyData && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Welcome to Vault.</p>
            Start by adding your first <Link className="underline" href="/accounts">account</Link>, then log a{" "}
            <Link className="underline" href="/transactions/new">transaction</Link>, or set up a{" "}
            <Link className="underline" href="/goals">goal</Link>. The dashboard updates instantly.
          </CardContent>
        </Card>
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
          delta={income > 0 ? `${m.count} transactions this month` : "no income logged"}
          deltaPositive
          icon={<ArrowUpRight className="size-4 text-[hsl(var(--chart-income))]" />}
        />
        <Kpi
          title="Monthly Expense"
          value={formatMoney(expense)}
          delta={expense > 0 ? "this month so far" : "no expenses logged"}
          deltaPositive
          icon={<ArrowDownRight className="size-4 text-[hsl(var(--chart-expense))]" />}
        />
        <Kpi
          title="Surplus / Savings Rate"
          value={formatMoney(surplus)}
          delta={income > 0 ? `${formatPct(savingsRate, 0)} saved` : "—"}
          deltaPositive={surplus >= 0}
          icon={<Wallet className="size-4 text-[hsl(var(--chart-savings))]" />}
        />
        <Kpi
          title="EMI burden"
          value={formatMoney(emiTotal)}
          delta={emiTotal > 0 && income > 0 ? `${formatPct(emiPct, 1)} of income — ${emiPct < 30 ? "healthy" : "watch"}` : "no active loans"}
          deltaPositive={emiPct < 30}
          icon={<TrendingUp className="size-4 text-[hsl(var(--chart-debt))]" />}
        />
        <Kpi
          title="Investments"
          value={formatMoney(inv.currentValue)}
          delta={inv.sip > 0 ? `${formatMoney(inv.sip, { compact: true })}/mo SIP` : inv.invested > 0 ? "manual" : "none yet"}
          deltaPositive={inv.currentValue >= inv.invested}
          icon={<TrendingUp className="size-4 text-[hsl(var(--chart-investment))]" />}
        />
        <Kpi
          title="Active goals"
          value={String(goals.length)}
          delta={goals.length > 0 ? `${goals.filter((g) => g.status === "active").length} active` : "set your first"}
          deltaPositive
          icon={<Target className="size-4 text-primary" />}
        />
        <Kpi
          title="FI corpus needed"
          value={formatMoney(fi, { compact: true })}
          delta={expense > 0 ? "25× annual expense" : "log a month of expenses first"}
          deltaPositive
          icon={<Wallet className="size-4 text-primary" />}
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
            {history.some((r) => r.income > 0 || r.expense > 0) ? (
              <CashflowChart data={history} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No transactions in the last 6 months yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where money goes — this month</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length > 0 ? (
              <>
                <BreakdownChart data={breakdown} />
                <ul className="mt-3 space-y-1.5 text-xs">
                  {breakdown.map((b) => (
                    <li key={b.name} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{b.name}</span>
                      <span className="tabular">{formatMoney(b.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No expenses this month yet.</p>
            )}
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
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No goals yet. <Link className="underline" href="/goals">Add your first</Link> — Emergency Fund, FI corpus, vacation, etc.
              </p>
            ) : (
              goals.slice(0, 4).map((g) => {
                const cur = Number(g.currentAmount);
                const tgt = Number(g.targetAmount);
                const pct = tgt ? Math.min(100, (cur / tgt) * 100) : 0;
                const months = monthsUntil(g.targetDate);
                const need = months !== null ? goalMonthlyRequired(cur, tgt, months) : null;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground tabular">
                        {formatMoney(cur, { compact: true })} / {formatMoney(tgt, { compact: true })}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pct.toFixed(1)}% complete</span>
                      {need !== null && months !== null && (
                        <span className="tabular">Needs ~{formatMoney(need, { compact: true })}/mo for {months} mo</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Independence projection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {expense > 0 ? (
              <>
                <Row label="Monthly expense (current)" value={formatMoney(expense)} />
                <Row label="Annual expense" value={formatMoney(expense * 12)} />
                <Row label="FI corpus (25× rule)" value={formatMoney(fi)} strong />
                <Row label="Investments today" value={formatMoney(inv.currentValue)} />
                <Row label="Current SIP" value={inv.sip > 0 ? `${formatMoney(inv.sip)}/mo` : "—"} />
                <div className="pt-2 text-xs text-muted-foreground border-t">
                  At a 12% expected annual return, your SIP would need to be roughly{" "}
                  <span className="text-foreground font-medium tabular">
                    {formatMoney(goalMonthlyRequired(inv.currentValue, fi, 12 * 12))}/mo
                  </span>{" "}
                  to reach FI in 12 years.
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Log a month of expenses and Vault will compute your FI target and the SIP required to reach it.
              </p>
            )}
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
          <p className={"mt-1 text-xs " + (deltaPositive ? "text-[hsl(var(--chart-income))]" : "text-muted-foreground")}>
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
