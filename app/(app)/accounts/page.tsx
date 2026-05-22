import { CreditCard, Landmark, Trash2, Wallet, TrendingUp, Banknote, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listAccounts, listEntities } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import { createAccount, deleteAccount } from "./actions";

const KIND_LABELS: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  credit_card: "Credit card",
  wallet: "Wallet",
  investment: "Investment",
  loan: "Loan (liability)",
  asset: "Other asset",
};

const KIND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bank: Landmark,
  cash: Banknote,
  credit_card: CreditCard,
  wallet: Wallet,
  investment: TrendingUp,
  loan: Landmark,
  asset: Boxes,
};

export default async function AccountsPage() {
  const [list, ents] = await Promise.all([listAccounts(), listEntities()]);
  const totalAssets = list
    .filter((a) => a.kind !== "credit_card" && a.kind !== "loan")
    .reduce((s, a) => s + Number(a.currentBalance), 0);
  const totalLiab = list
    .filter((a) => a.kind === "credit_card" || a.kind === "loan")
    .reduce((s, a) => s + Number(a.currentBalance), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] max-w-6xl">
      <div className="space-y-4">
        {list.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="Assets" value={formatMoney(totalAssets)} />
            <Stat label="Liabilities" value={formatMoney(totalLiab)} />
            <Stat label="Net" value={formatMoney(totalAssets - totalLiab)} />
          </div>
        )}

        {list.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No accounts yet. Add your bank, cash, credit card, investments on the right.
            </CardContent>
          </Card>
        ) : (
          list.map((a) => {
            const Icon = KIND_ICONS[a.kind] ?? Wallet;
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="size-4 text-primary" />
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">{a.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {KIND_LABELS[a.kind]} · {a.entityName}
                          {a.institution ? ` · ${a.institution}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold tabular">{formatMoney(Number(a.currentBalance))}</span>
                      <form action={deleteAccount}>
                        <input type="hidden" name="id" value={a.id} />
                        <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Add account</CardTitle>
        </CardHeader>
        <CardContent>
          {ents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create an entity first on the Entities page.</p>
          ) : (
            <form action={createAccount} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="entityId">Entity</Label>
                <Select id="entityId" name="entityId" required defaultValue={ents[0].id}>
                  {ents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.kind})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="HDFC Savings, Cash, ICICI Credit Card" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kind">Type</Label>
                <Select id="kind" name="kind" defaultValue="bank">
                  {Object.entries(KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" name="institution" placeholder="HDFC Bank" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="openingBalance">Opening balance</Label>
                  <Input id="openingBalance" name="openingBalance" type="number" step="0.01" defaultValue="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="creditLimit">Credit limit</Label>
                  <Input id="creditLimit" name="creditLimit" type="number" step="0.01" placeholder="for credit cards" />
                </div>
              </div>
              <Button type="submit" className="w-full">Add</Button>
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
