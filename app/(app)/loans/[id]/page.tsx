import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="max-w-5xl space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/loans"><ArrowLeft className="size-4" /> Back</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">{row.loan.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Field label="Principal" value={formatMoney(Number(row.loan.principal))} />
          <Field label="Rate" value={formatPct(Number(row.loan.interestRate))} />
          <Field label="EMI" value={formatMoney(Number(row.loan.emi))} />
          <Field label="Tenure" value={`${row.loan.tenureMonths} months`} />
          <Field label="Total interest" value={formatMoney(totalInterest)} />
          <Field label="Total payout" value={formatMoney(totalPaid)} />
          <Field label="Outstanding" value={formatMoney(Number(row.loan.outstanding))} />
          <Field label="Entity" value={row.entity.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Amortization schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular">
              <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Due</th>
                  <th className="px-4 py-2 text-right">EMI</th>
                  <th className="px-4 py-2 text-right">Principal</th>
                  <th className="px-4 py-2 text-right">Interest</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {schedule.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-muted-foreground">{r.installmentNo}</td>
                    <td className="px-4 py-2">{new Date(r.dueDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(Number(r.emi))}</td>
                    <td className="px-4 py-2 text-right text-[hsl(var(--chart-income))]">{formatMoney(Number(r.principalComponent))}</td>
                    <td className="px-4 py-2 text-right text-[hsl(var(--chart-debt))]">{formatMoney(Number(r.interestComponent))}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(Number(r.balanceAfter))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
