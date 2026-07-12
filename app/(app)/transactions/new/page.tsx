import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listAccounts, listCategories } from "@/lib/queries";
import { createTransaction } from "../actions";

function todayLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ amount?: string; payee?: string; description?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const [accts, incomeCats, expenseCats] = await Promise.all([
    listAccounts(),
    listCategories("income"),
    listCategories("expense"),
  ]);
  const defaultKind = sp.kind === "income" || sp.kind === "transfer" ? sp.kind : "expense";

  const flatExpense = expenseCats.filter((c) => c.name.startsWith("Flat"));
  const personalExpense = expenseCats.filter((c) => !c.name.startsWith("Flat"));
  const flatIncome = incomeCats.filter((c) => c.name.includes("Flatmate"));
  const personalIncome = incomeCats.filter((c) => !c.name.includes("Flatmate"));

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        eyebrow="New entry"
        title="Log a transaction"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions">Cancel</Link>
          </Button>
        }
      />

      {accts.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Add an <Link className="underline" href="/accounts">account</Link> first — every transaction needs one.
        </Card>
      ) : (
        <Card className="p-6">
          <form action={createTransaction} className="space-y-5">
            {/* type toggle */}
            <div className="grid grid-cols-3 gap-1 bg-secondary rounded-[12px] p-1">
              {(["expense", "income", "transfer"] as const).map((k) => (
                <label
                  key={k}
                  className="flex items-center justify-center rounded-[9px] px-3 py-2 text-[12.5px] font-mono uppercase tracking-wider cursor-pointer has-[:checked]:bg-white has-[:checked]:text-foreground has-[:checked]:shadow-sm text-muted-foreground transition"
                >
                  <input type="radio" name="kind" value={k} defaultChecked={k === defaultKind} className="sr-only" />
                  {k}
                </label>
              ))}
            </div>

            <div>
              <Label htmlFor="amount" className="eyebrow">Amount ₹</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                autoFocus
                inputMode="decimal"
                defaultValue={sp.amount}
                className="mt-2 h-14 text-[24px] num-serif"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="accountId" className="eyebrow">From account</Label>
                <Select id="accountId" name="accountId" required className="mt-2">
                  {accts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="toAccountId" className="eyebrow">To (transfer)</Label>
                <Select id="toAccountId" name="toAccountId" defaultValue="" className="mt-2">
                  <option value="">—</option>
                  {accts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="categoryId" className="eyebrow">Category</Label>
              <Select id="categoryId" name="categoryId" defaultValue="" className="mt-2">
                <option value="">—</option>
                <optgroup label="Flat / shared">
                  {flatExpense.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {flatIncome.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Expense">
                  {personalExpense.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Income">
                  {personalIncome.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </Select>
            </div>

            <details className="group rounded-[12px] border border-border-soft bg-cream/50 p-4 open:pb-3">
              <summary className="cursor-pointer text-[12.5px] font-mono uppercase tracking-wider text-muted-foreground group-open:text-foreground select-none flex items-center justify-between">
                Flat / shared with roommates
                <span className="text-[10px]">▾</span>
              </summary>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" name="isFlatShared" value="on" className="accent-primary w-4 h-4" />
                  This is a shared flat expense / income
                </label>
                <div>
                  <Label htmlFor="flatSharePct" className="eyebrow">Your share %</Label>
                  <Input
                    id="flatSharePct"
                    name="flatSharePct"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 50 for 50%"
                    className="mt-2"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    The total amount stays as-is. Dashboard will show your net share.
                  </p>
                </div>
              </div>
            </details>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payee" className="eyebrow">Payee / Source</Label>
                <Input id="payee" name="payee" placeholder="Zomato, Salary…" defaultValue={sp.payee} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="occurredAt" className="eyebrow">When</Label>
                <Input
                  id="occurredAt"
                  name="occurredAt"
                  type="datetime-local"
                  defaultValue={todayLocal()}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="eyebrow">Note</Label>
              <Input
                id="description"
                name="description"
                placeholder="Optional"
                defaultValue={sp.description}
                className="mt-2"
              />
            </div>

            <Button type="submit" className="w-full" variant="primary">Save transaction</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
