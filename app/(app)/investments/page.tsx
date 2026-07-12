import { Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listInvestments } from "@/lib/queries";
import { formatMoney, formatPct } from "@/lib/utils";
import { createInvestment, deleteInvestment } from "./actions";

const LABELS: Record<string, string> = {
  mutual_fund: "Mutual fund",
  stock: "Stock",
  etf: "ETF",
  gold: "Gold",
  silver: "Silver",
  fd: "Fixed deposit",
  ppf: "PPF",
  epf: "EPF",
  nps: "NPS",
  crypto: "Crypto",
  other: "Other",
};

export default async function InvestmentsPage() {
  const list = await listInvestments();
  const totalInvested = list.reduce((s, i) => s + Number(i.invested), 0);
  const totalCurrent = list.reduce((s, i) => s + Number(i.currentValue), 0);
  const gain = totalCurrent - totalInvested;
  const gainPct = totalInvested ? (gain / totalInvested) * 100 : 0;
  const monthlySip = list.reduce((s, i) => s + Number(i.sipAmount ?? 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <PageHeader eyebrow="Portfolio" title="Investments" />

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
          <Stat label="Invested" value={formatMoney(totalInvested, { compact: true })} />
          <Stat label="Current" value={formatMoney(totalCurrent, { compact: true })} />
          <Stat label="Gain" value={`${formatMoney(gain, { compact: true })} (${formatPct(gainPct, 1)})`} tone={gain >= 0 ? "income" : "expense"} />
          <Stat label="Monthly SIP" value={formatMoney(monthlySip, { compact: true })} />
        </div>

        {list.length === 0 ? (
          <Card className="p-8 text-center text-[13px] text-muted-foreground">
            No investments yet. Add SIPs, stocks, gold, EPF, PPF — manual valuation for now.
          </Card>
        ) : (
          <div className="space-y-3">
            {list.map((i) => {
              const g = Number(i.currentValue) - Number(i.invested);
              return (
                <Card key={i.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <div className="chip-invest w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate">{i.name}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">{LABELS[i.kind]}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-wrap">
                    <Field label="Current" value={formatMoney(Number(i.currentValue), { compact: true })} />
                    <Field
                      label="Gain"
                      value={formatMoney(g, { compact: true })}
                      color={g >= 0 ? "income" : "expense"}
                    />
                    <Field label="SIP" value={i.sipAmount ? formatMoney(Number(i.sipAmount), { compact: true }) : "—"} />
                    <form action={deleteInvestment}>
                      <input type="hidden" name="id" value={i.id} />
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
        <h2 className="text-[14px] font-semibold mb-4">Add investment</h2>
        <form action={createInvestment} className="space-y-3">
          <div>
            <Label htmlFor="name" className="eyebrow">Name</Label>
            <Input id="name" name="name" required placeholder="Parag Parikh Flexi Cap, EPF, Gold" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="kind" className="eyebrow">Type</Label>
            <Select id="kind" name="kind" defaultValue="mutual_fund" className="mt-2">
              {Object.entries(LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="invested" className="eyebrow">Invested ₹</Label>
              <Input id="invested" name="invested" type="number" step="0.01" defaultValue="0" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="currentValue" className="eyebrow">Current ₹</Label>
              <Input id="currentValue" name="currentValue" type="number" step="0.01" className="mt-2" />
            </div>
          </div>
          <div>
            <Label htmlFor="sipAmount" className="eyebrow">Monthly SIP ₹ (opt)</Label>
            <Input id="sipAmount" name="sipAmount" type="number" step="0.01" className="mt-2" />
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
      <div className={`num-serif text-[23px] mt-1.5 ${color}`}>{value}</div>
    </Card>
  );
}

function Field({ label, value, color = "default" }: { label: string; value: string; color?: "income" | "expense" | "default" }) {
  const c = color === "income" ? "text-income" : color === "expense" ? "text-expense" : "text-foreground";
  return (
    <div className="text-right">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`tnum text-[14px] font-semibold ${c}`}>{value}</div>
    </div>
  );
}
