import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  searchParams: Promise<{ amount?: string; payee?: string; description?: string }>;
}) {
  const sp = await searchParams;
  const [accts, incomeCats, expenseCats] = await Promise.all([
    listAccounts(),
    listCategories("income"),
    listCategories("expense"),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground">Add transaction</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions">Back</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create an account first on the <Link className="underline" href="/accounts">Accounts</Link> page.
            </p>
          ) : (
            <form action={createTransaction} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {["expense", "income", "transfer"].map((k) => (
                  <label
                    key={k}
                    className="flex items-center justify-center rounded-md border bg-secondary/30 px-3 py-2 text-sm font-medium capitalize cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
                  >
                    <input type="radio" name="kind" value={k} defaultChecked={k === "expense"} className="sr-only" />
                    {k}
                  </label>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required autoFocus inputMode="decimal" defaultValue={sp.amount} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="accountId">From account</Label>
                  <Select id="accountId" name="accountId" required>
                    {accts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.entityName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="toAccountId">To (transfers only)</Label>
                  <Select id="toAccountId" name="toAccountId" defaultValue="">
                    <option value="">—</option>
                    {accts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.entityName}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category</Label>
                <Select id="categoryId" name="categoryId" defaultValue="">
                  <option value="">—</option>
                  <optgroup label="Expense">
                    {expenseCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Income">
                    {incomeCats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="payee">Payee / source</Label>
                  <Input id="payee" name="payee" placeholder="Zomato, Salary, etc." defaultValue={sp.payee} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="occurredAt">When</Label>
                  <Input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={todayLocal()} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Note</Label>
                <Input id="description" name="description" placeholder="Optional" defaultValue={sp.description} />
              </div>

              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
