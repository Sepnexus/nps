import { Landmark, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { dashboardMetrics, listLoans } from "@/lib/queries";
import { formatMoney, formatPct } from "@/lib/utils";
import { createLoan, deleteLoan } from "./actions";

const LABELS: Record<string, string> = {
  personal: "Personal",
  home: "Home",
  vehicle: "Vehicle",
  education: "Education",
  credit_card: "Credit card",
  other: "Other",
};

export default async function LoansPage() {
  const [list, m] = await Promise.all([listLoans(), dashboardMetrics()]);
  const totalOutstanding = list.reduce((s, l) => s + Number(l.outstanding), 0);
  const totalEmi = list.reduce((s, l) => s + Number(l.emi), 0);
  const emiPct = m.income > 0 ? (totalEmi / m.income) * 100 : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <PageHeader eyebrow="Debt" title="Loans" />

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          <Stat label="Outstanding" value={formatMoney(totalOutstanding, { compact: true })} tone="expense" />
          <Stat label="Monthly EMI" value={formatMoney(totalEmi, { compact: true })} />
          <Stat label="EMI / income" value={m.income > 0 ? formatPct(emiPct, 1) : "—"} tone={emiPct < 30 ? "income" : "expense"} />
        </div>

        {list.length === 0 ? (
          <Card className="p-8 text-center text-[13px] text-muted-foreground">
            No loans yet. Add your EMIs on the right — Vault generates the full amortization schedule.
          </Card>
        ) : (
          <div className="space-y-3">
            {list.map((l) => {
              const outNum = Number(l.outstanding);
              const priNum = Number(l.principal);
              const paidNum = Math.max(0, priNum - outNum);
              const paidPct = priNum > 0 ? (paidNum / priNum) * 100 : 0;
              return (
                <Card key={l.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="chip-loan w-[40px] h-[40px] rounded-[11px] flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-[19px] h-[19px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-semibold truncate">{l.name}</div>
                        <div className="text-[11.5px] text-muted-foreground truncate">
                          {LABELS[l.kind]}
                          {l.lender ? ` · ${l.lender}` : ""}
                        </div>
                      </div>
                    </div>
                    <form action={deleteLoan}>
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        type="submit"
                        aria-label="Delete"
                        className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-expense opacity-50 hover:opacity-100 hover:bg-[rgba(199,86,59,0.08)] transition"
                      >
                        <Trash2 className="w-[14px] h-[14px]" />
                      </button>
                    </form>
                  </div>
                  <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))" }}>
                    <Field label="Outstanding" value={formatMoney(outNum, { compact: true })} />
                    <Field label="EMI" value={formatMoney(Number(l.emi), { compact: true })} />
                    <Field label="Rate" value={formatPct(Number(l.interestRate))} />
                    <Field label="Tenure" value={`${l.tenureMonths} mo`} />
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>Paid {paidPct.toFixed(1)}%</span>
                      <span className="tnum">
                        {formatMoney(paidNum, { compact: true })} of {formatMoney(priNum, { compact: true })}
                      </span>
                    </div>
                    <div className="h-[7px] rounded-[6px] bg-secondary overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${paidPct}%` }} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/loans/${l.id}`}>View schedule →</Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-4 p-5">
        <h2 className="text-[14px] font-semibold mb-4">Add loan</h2>
        <form action={createLoan} className="space-y-3">
          <div>
            <Label htmlFor="name" className="eyebrow">Name</Label>
            <Input id="name" name="name" required placeholder="HDFC personal loan" className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="kind" className="eyebrow">Type</Label>
              <Select id="kind" name="kind" defaultValue="personal" className="mt-2">
                {Object.entries(LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="lender" className="eyebrow">Lender</Label>
              <Input id="lender" name="lender" placeholder="HDFC Bank" className="mt-2" />
            </div>
          </div>
          <div>
            <Label htmlFor="principal" className="eyebrow">Principal ₹</Label>
            <Input id="principal" name="principal" type="number" step="0.01" required className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="interestRate" className="eyebrow">Rate % p.a.</Label>
              <Input id="interestRate" name="interestRate" type="number" step="0.01" required defaultValue="11" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="tenureMonths" className="eyebrow">Tenure mo</Label>
              <Input id="tenureMonths" name="tenureMonths" type="number" required defaultValue="36" className="mt-2" />
            </div>
          </div>
          <div>
            <Label htmlFor="startDate" className="eyebrow">Start date</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-2" />
          </div>
          <Button type="submit" variant="primary" className="w-full">Add & generate schedule</Button>
        </form>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: string; tone?: "income" | "expense" | "muted" }) {
  const color = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{label}</div>
      <div className={`num-serif text-[25px] mt-1.5 ${color}`}>{value}</div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="tnum text-[14px] font-semibold mt-0.5">{value}</div>
    </div>
  );
}
