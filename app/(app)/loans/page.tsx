import { Landmark, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listEntities, listLoans } from "@/lib/queries";
import { emi } from "@/lib/finance";
import { formatMoney, formatPct } from "@/lib/utils";
import { createLoan, deleteLoan } from "./actions";

const LOAN_KIND_LABELS: Record<string, string> = {
  personal: "Personal",
  home: "Home",
  vehicle: "Vehicle",
  education: "Education",
  credit_card: "Credit card",
  other: "Other",
};

export default async function LoansPage() {
  const [list, ents] = await Promise.all([listLoans(), listEntities()]);
  const totalOutstanding = list.reduce((s, l) => s + Number(l.outstanding), 0);
  const totalEmi = list.reduce((s, l) => s + Number(l.emi), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] max-w-6xl">
      <div className="space-y-4">
        {list.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="Total outstanding" value={formatMoney(totalOutstanding)} />
            <Stat label="Total monthly EMI" value={formatMoney(totalEmi)} />
            <Stat label="Active loans" value={String(list.filter((l) => !l.isClosed).length)} />
          </div>
        )}

        {list.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No loans yet. Add your EMIs on the right — Vault will generate the full amortization schedule.
            </CardContent>
          </Card>
        ) : (
          list.map((l) => (
            <Card key={l.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Landmark className="size-4 text-[hsl(var(--chart-debt))]" />
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">{l.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {LOAN_KIND_LABELS[l.kind]} · {l.entityName}
                        {l.lender ? ` · ${l.lender}` : ""}
                      </p>
                    </div>
                  </div>
                  <form action={deleteLoan}>
                    <input type="hidden" name="id" value={l.id} />
                    <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-4 gap-3 text-sm">
                <Field label="Outstanding" value={formatMoney(Number(l.outstanding))} />
                <Field label="EMI" value={`${formatMoney(Number(l.emi))}/mo`} />
                <Field label="Rate" value={formatPct(Number(l.interestRate))} />
                <Field label="Tenure" value={`${l.tenureMonths} months`} />
                <div className="sm:col-span-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/loans/${l.id}`}>View schedule</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Add loan</CardTitle>
        </CardHeader>
        <CardContent>
          {ents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create an entity first.</p>
          ) : (
            <form action={createLoan} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="entityId">Entity</Label>
                <Select id="entityId" name="entityId" required defaultValue={ents[0].id}>
                  {ents.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="HDFC personal loan" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="kind">Type</Label>
                  <Select id="kind" name="kind" defaultValue="personal">
                    {Object.entries(LOAN_KIND_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lender">Lender</Label>
                  <Input id="lender" name="lender" placeholder="HDFC Bank" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="principal">Principal (₹)</Label>
                <Input id="principal" name="principal" type="number" step="0.01" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="interestRate">Rate % p.a.</Label>
                  <Input id="interestRate" name="interestRate" type="number" step="0.01" required defaultValue="11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tenureMonths">Tenure (months)</Label>
                  <Input id="tenureMonths" name="tenureMonths" type="number" required defaultValue="36" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <Button type="submit" className="w-full">Add &amp; generate schedule</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tabular font-medium">{value}</div>
    </div>
  );
}
