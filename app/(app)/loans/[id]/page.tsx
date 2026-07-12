import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { db } from "@/db";
import { entities, loanSchedule, loans } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatMoney, formatPct } from "@/lib/utils";

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser();
  const [row] = await db
    .select({ loan: loans, entity: entities })
    .from(loans)
    .innerJoin(entities, eq(entities.id, loans.entityId))
    .where(and(eq(loans.id, id), eq(entities.userId, u.id)))
    .limit(1);
  if (!row) notFound();

  const schedule = await db
    .select()
    .from(loanSchedule)
    .where(eq(loanSchedule.loanId, id))
    .orderBy(loanSchedule.installmentNo);

  const totalInterest = schedule.reduce((s, r) => s + Number(r.interestComponent), 0);
  const totalPaid = Number(row.loan.principal) + totalInterest;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/loans">
          <ArrowLeft className="w-4 h-4" /> Back to loans
        </Link>
      </Button>

      <PageHeader eyebrow="Detail" title={row.loan.name} />

      <Card className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <F label="Principal" value={formatMoney(Number(row.loan.principal), { compact: true })} />
        <F label="Rate" value={formatPct(Number(row.loan.interestRate))} />
        <F label="EMI" value={formatMoney(Number(row.loan.emi), { compact: true })} />
        <F label="Tenure" value={`${row.loan.tenureMonths} months`} />
        <F label="Total interest" value={formatMoney(totalInterest, { compact: true })} tone="expense" />
        <F label="Total payout" value={formatMoney(totalPaid, { compact: true })} />
        <F label="Outstanding" value={formatMoney(Number(row.loan.outstanding), { compact: true })} tone="expense" />
        <F label="Lender" value={row.loan.lender ?? "—"} />
      </Card>

      <Card>
        <div className="p-5 border-b border-[hsl(var(--border-soft))]">
          <h2 className="text-[14px] font-semibold">Amortization schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] tnum">
            <thead className="bg-cream text-[11px] uppercase text-muted-foreground font-mono">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-right">EMI</th>
                <th className="px-4 py-3 text-right">Principal</th>
                <th className="px-4 py-3 text-right">Interest</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-soft))]">
              {schedule.map((r) => (
                <tr key={r.id} className="hover:bg-cream/50">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.installmentNo}</td>
                  <td className="px-4 py-2.5">
                    {new Date(r.dueDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(Number(r.emi))}</td>
                  <td className="px-4 py-2.5 text-right text-income">{formatMoney(Number(r.principalComponent))}</td>
                  <td className="px-4 py-2.5 text-right text-expense">{formatMoney(Number(r.interestComponent))}</td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(Number(r.balanceAfter))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function F({ label, value, tone = "muted" }: { label: string; value: string; tone?: "income" | "expense" | "muted" }) {
  const color = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{label}</div>
      <div className={`num-serif text-[20px] mt-1 ${color}`}>{value}</div>
    </div>
  );
}
