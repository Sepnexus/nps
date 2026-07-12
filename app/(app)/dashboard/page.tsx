import {
  ArrowDownRight,
  ArrowUpRight,
  Home,
  Landmark,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { fiCorpus, goalMonthlyRequired } from "@/lib/finance";
import {
  dashboardMetrics,
  expenseBreakdown,
  flatShareSummary,
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

const DOT_COLORS = ["#C7563B", "#E1A73E", "#2F7D57", "#7B5EA7", "#3E6DA6", "#0E7C86", "#B0685C", "#8B8478"];

export default async function DashboardPage() {
  const [user, m, nw, history, breakdown, emiTotal, inv, goals, flat] = await Promise.all([
    requireUser(),
    dashboardMetrics(),
    netWorth(),
    monthlyHistory(6),
    expenseBreakdown(8),
    totalMonthlyEmi(),
    investmentTotals(),
    listGoals(),
    flatShareSummary(),
  ]);

  const income = m.income;
  const expense = m.expense;
  const surplus = income - expense;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;
  const emiPct = income > 0 ? (emiTotal / income) * 100 : 0;
  const fi = expense > 0 ? fiCorpus(expense) : 0;
  const spentTotal = breakdown.reduce((s, b) => s + b.value, 0);
  const chartMax = Math.max(1, ...history.map((r) => Math.max(r.income, r.expense)));
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user.displayName ?? user.email.split("@")[0]).split(/\s+/)[0];
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasAnyData = m.count > 0 || nw.assets > 0 || emiTotal > 0 || inv.invested > 0 || goals.length > 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header>
        <div className="eyebrow">Overview</div>
        <h1 className="h1-serif-lg mt-1.5">
          {greeting}, {firstName}
        </h1>
        <div className="text-[13px] text-muted-foreground mt-1">{dateStr} · Personal book</div>
      </header>

      {!hasAnyData && (
        <Card className="p-5 text-[13.5px] text-muted-foreground">
          <p className="text-foreground font-semibold mb-1">Welcome to Vault.</p>
          Start by adding your first <Link className="underline" href="/accounts">account</Link>, then log a{" "}
          <Link className="underline" href="/transactions/new">transaction</Link>, or set up a{" "}
          <Link className="underline" href="/goals">goal</Link>.
        </Card>
      )}

      {/* KPI grid */}
      <section className="grid gap-[14px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(158px,1fr))" }}>
        <Kpi title="Net worth" value={formatMoney(nw.net, { compact: true })} delta={`Assets ${formatMoney(nw.assets, { compact: true })}`} icon={<Wallet className="w-4 h-4" />} tint="chip-goal" />
        <Kpi
          title="Monthly income"
          value={formatMoney(income, { compact: true })}
          delta={income > 0 ? `${m.count} entries this month` : "none logged"}
          icon={<ArrowUpRight className="w-4 h-4" />}
          tint="chip-income"
          deltaTone="income"
        />
        <Kpi
          title="Monthly expense"
          value={formatMoney(expense, { compact: true })}
          delta={expense > 0 ? "this month so far" : "none logged"}
          icon={<ArrowDownRight className="w-4 h-4" />}
          tint="chip-expense"
          deltaTone="expense"
        />
        <Kpi
          title="Surplus"
          value={formatMoney(surplus, { compact: true })}
          delta={income > 0 ? `${formatPct(savingsRate, 0)} saved` : "—"}
          icon={<TrendingUp className="w-4 h-4" />}
          tint="chip-goal"
          deltaTone={surplus >= 0 ? "income" : "expense"}
        />
        <Kpi
          title="EMI burden"
          value={formatMoney(emiTotal, { compact: true })}
          delta={emiTotal > 0 && income > 0 ? `${formatPct(emiPct, 0)} of income` : "no active loans"}
          icon={<Landmark className="w-4 h-4" />}
          tint="chip-loan"
        />
        <Kpi
          title="Investments"
          value={formatMoney(inv.currentValue, { compact: true })}
          delta={inv.sip > 0 ? `${formatMoney(inv.sip, { compact: true })}/mo SIP` : inv.invested > 0 ? "manual" : "none yet"}
          icon={<TrendingUp className="w-4 h-4" />}
          tint="chip-invest"
        />
        <Kpi
          title="Flat share (yours)"
          value={formatMoney(flat.yours, { compact: true })}
          delta={flat.owedByFlatmates > 0 ? `Flatmates owe ${formatMoney(flat.owedByFlatmates - flat.contributions, { compact: true })}` : flat.count > 0 ? "settled" : "no flat expenses"}
          icon={<Home className="w-4 h-4" />}
          tint="chip-flat"
        />
        <Kpi
          title="Active goals"
          value={String(goals.length)}
          delta={goals.length > 0 ? "in progress" : "set your first"}
          icon={<Target className="w-4 h-4" />}
          tint="chip-goal"
        />
      </section>

      {/* Cash flow + breakdown */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold">
              Cash flow <span className="text-muted-foreground font-normal">· last 6 months</span>
            </div>
            <div className="flex gap-4 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-income" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-expense" /> Expense
              </span>
            </div>
          </div>
          <div className="h-[196px] flex items-end justify-between gap-2.5">
            {history.map((r) => (
              <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-end gap-1.5 h-[168px]">
                  <div
                    className="w-[14px] rounded-t-[4px] bg-income"
                    style={{ height: `${(r.income / chartMax) * 100}%` }}
                  />
                  <div
                    className="w-[14px] rounded-t-[4px] bg-expense"
                    style={{ height: `${(r.expense / chartMax) * 100}%` }}
                  />
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">{r.month}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-lg p-5">
          <div className="text-[14px] font-semibold mb-4">
            Where money goes <span className="text-muted-foreground font-normal">· this month</span>
          </div>
          {breakdown.length > 0 ? (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-[140px] h-[140px]">
                  <Donut segments={breakdown.map((b, i) => ({ value: b.value, color: DOT_COLORS[i % DOT_COLORS.length] }))} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground">SPENT</div>
                    <div className="num-serif text-[20px]">{formatMoney(spentTotal, { compact: true })}</div>
                  </div>
                </div>
              </div>
              <ul className="space-y-1.5 text-[12.5px]">
                {breakdown.map((b, i) => (
                  <li key={b.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-foreground/75 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                      <span className="truncate">{b.name}</span>
                    </span>
                    <span className="tnum">{formatMoney(b.value, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="py-8 text-center text-[13px] text-muted-foreground">No expenses this month yet.</p>
          )}
        </Card>
      </section>

      {/* Flat share detail */}
      {flat.count > 0 && (
        <Card className="rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-accent-blue" />
              <div className="text-[14px] font-semibold">
                Flat share <span className="text-muted-foreground font-normal">· this month</span>
              </div>
            </div>
            <Link href="/transactions?filter=flat" className="text-[12px] text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FlatStat label="Gross paid" value={formatMoney(flat.gross)} sub="all flat expenses" />
            <FlatStat label="Your share" value={formatMoney(flat.yours)} sub="what you actually owe" tone="expense" />
            <FlatStat label="Contributions in" value={formatMoney(flat.contributions)} sub="received from flatmates" tone="income" />
            <FlatStat
              label={flat.net > 0 ? "Flatmates still owe you" : "Settled / you owe"}
              value={formatMoney(Math.abs(flat.net))}
              sub={flat.net > 0 ? "outstanding" : "even"}
              tone={flat.net > 0 ? "income" : "muted"}
            />
          </div>
        </Card>
      )}

      {/* Goals + FI card */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold">Goals</div>
            <Link href="/goals" className="text-[12px] text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No goals yet. <Link className="underline" href="/goals">Add your first</Link>.
            </p>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 4).map((g) => {
                const cur = Number(g.currentAmount);
                const tgt = Number(g.targetAmount);
                const pct = tgt ? Math.min(100, (cur / tgt) * 100) : 0;
                const months = monthsUntil(g.targetDate);
                const need = months !== null ? goalMonthlyRequired(cur, tgt, months) : null;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="font-semibold">{g.name}</span>
                      <span className="tnum text-muted-foreground text-[12.5px]">
                        {formatMoney(cur, { compact: true })} / {formatMoney(tgt, { compact: true })}
                      </span>
                    </div>
                    <div className="mt-2 h-[7px] rounded-[6px] bg-secondary overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{pct.toFixed(1)}% complete</span>
                      {need !== null && months !== null && (
                        <span className="tnum">Needs {formatMoney(need, { compact: true })}/mo for {months} mo</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="rounded-lg bg-dark-panel text-dark-panel-foreground border border-dark-panel p-6 flex flex-col">
          <div className="font-mono text-[10px] tracking-[0.14em] text-dark-panel-muted">FINANCIAL INDEPENDENCE</div>
          <div className="font-serif text-[30px] leading-[1.05] mt-2 mb-4">
            {expense > 0 ? `Your path to ${formatMoney(fi, { compact: true })}` : "Log a month of expenses"}
          </div>
          {expense > 0 ? (
            <>
              <div className="space-y-3 text-[13px]">
                <FIRow label="Monthly expense" value={formatMoney(expense)} />
                <FIRow label="Annual expense" value={formatMoney(expense * 12)} />
                <FIRow label="FI corpus (25× rule)" value={formatMoney(fi, { compact: true })} bold highlight />
                <FIRow label="Invested today" value={formatMoney(inv.currentValue)} />
                <FIRow label="Current SIP" value={inv.sip > 0 ? `${formatMoney(inv.sip)}/mo` : "—"} />
              </div>
              <div className="mt-4 pt-3.5 border-t border-white/10 text-[12px] text-dark-panel-muted leading-[1.5]">
                At 12% expected return, a SIP of{" "}
                <span className="tnum text-dark-panel-foreground font-semibold">
                  {formatMoney(goalMonthlyRequired(inv.currentValue, fi, 12 * 12))}/mo
                </span>{" "}
                reaches FI in 12 years.
              </div>
            </>
          ) : (
            <p className="text-[13px] text-dark-panel-muted">
              Vault computes your FI target and required SIP once you have a month of real expenses.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  title,
  value,
  delta,
  icon,
  tint,
  deltaTone = "muted",
}: {
  title: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  tint: string;
  deltaTone?: "income" | "expense" | "muted";
}) {
  const deltaColor =
    deltaTone === "income"
      ? "text-income"
      : deltaTone === "expense"
        ? "text-expense"
        : "text-muted-foreground";
  return (
    <div className="bg-card border border-border-soft rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-muted-foreground">{title}</span>
        <div className={`${tint} w-6 h-6 rounded-[8px] flex items-center justify-center`}>{icon}</div>
      </div>
      <div className="num-serif text-[26px] leading-none mt-2.5">{value}</div>
      <div className={`text-[11.5px] leading-[1.3] mt-2 ${deltaColor}`}>{delta}</div>
    </div>
  );
}

function FIRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-dark-panel-muted">{label}</span>
      <span className={`tnum ${highlight ? "text-amber" : ""}`}>{value}</span>
    </div>
  );
}

function FlatStat({ label, value, sub, tone = "muted" }: { label: string; value: string; sub: string; tone?: "income" | "expense" | "muted" }) {
  const color = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{label}</div>
      <div className={`num-serif text-[22px] mt-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

/** SVG-based donut with a hollow center. Segments are scaled to sum to 360deg. */
function Donut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  const r = 62;
  const cx = 70;
  const cy = 70;
  let acc = 0;
  const paths = segments.map((s) => {
    const startAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
    acc += s.value;
    const endAngle = (acc / total) * 2 * Math.PI - Math.PI / 2;
    const large = s.value / total > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: s.color };
  });
  return (
    <svg viewBox="0 0 140 140" className="w-full h-full">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.56} fill="hsl(var(--card))" />
    </svg>
  );
}
