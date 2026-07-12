import { Banknote, Boxes, CreditCard, Landmark, TrendingUp, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listAccounts } from "@/lib/queries";
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

const KIND_CHIP: Record<string, string> = {
  bank: "chip-goal",
  cash: "chip-income",
  credit_card: "chip-expense",
  wallet: "chip-flat",
  investment: "chip-invest",
  loan: "chip-loan",
  asset: "chip-flat",
};

export default async function AccountsPage() {
  const list = await listAccounts();
  const totalAssets = list
    .filter((a) => a.kind !== "credit_card" && a.kind !== "loan")
    .reduce((s, a) => s + Number(a.currentBalance), 0);
  const totalLiab = list
    .filter((a) => a.kind === "credit_card" || a.kind === "loan")
    .reduce((s, a) => s + Number(a.currentBalance), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <PageHeader eyebrow="Balance" title="Accounts" />

        {list.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-3 mb-2">
            <Stat label="Assets" value={formatMoney(totalAssets, { compact: true })} tone="income" />
            <Stat label="Liabilities" value={formatMoney(totalLiab, { compact: true })} tone="expense" />
            <Stat label="Net" value={formatMoney(totalAssets - totalLiab, { compact: true })} />
          </div>
        )}

        {list.length === 0 ? (
          <Card className="p-8 text-center text-[13px] text-muted-foreground">
            No accounts yet. Add your bank, cash, credit card, investments on the right.
          </Card>
        ) : (
          <div className="space-y-3">
            {list.map((a) => {
              const Icon = KIND_ICONS[a.kind] ?? Wallet;
              const chip = KIND_CHIP[a.kind] ?? "chip-flat";
              return (
                <Card key={a.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-[40px] h-[40px] rounded-[11px] flex items-center justify-center flex-shrink-0 ${chip}`}>
                      <Icon className="w-[19px] h-[19px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-semibold truncate">{a.name}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {KIND_LABELS[a.kind]}
                        {a.institution ? ` · ${a.institution}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="num-serif text-[20px]">{formatMoney(Number(a.currentBalance), { compact: true })}</span>
                    <form action={deleteAccount}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        aria-label="Delete"
                        className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-expense opacity-50 hover:opacity-100 hover:bg-[rgba(199,86,59,0.08)] transition"
                      >
                        <Trash2 className="w-[14px] h-[14px]" />
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-4 p-5">
        <h2 className="text-[14px] font-semibold mb-4">Add account</h2>
        <form action={createAccount} className="space-y-3">
          <div>
            <Label htmlFor="name" className="eyebrow">Name</Label>
            <Input id="name" name="name" required placeholder="HDFC Savings" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="kind" className="eyebrow">Type</Label>
            <Select id="kind" name="kind" defaultValue="bank" className="mt-2">
              {Object.entries(KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="institution" className="eyebrow">Institution</Label>
            <Input id="institution" name="institution" placeholder="HDFC Bank" className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="openingBalance" className="eyebrow">Opening ₹</Label>
              <Input id="openingBalance" name="openingBalance" type="number" step="0.01" defaultValue="0" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="creditLimit" className="eyebrow">Credit limit</Label>
              <Input id="creditLimit" name="creditLimit" type="number" step="0.01" placeholder="cards" className="mt-2" />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full">Add</Button>
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
