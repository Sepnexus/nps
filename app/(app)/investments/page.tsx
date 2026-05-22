import { Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listEntities, listInvestments } from "@/lib/queries";
import { formatMoney, formatPct } from "@/lib/utils";
import { createInvestment, deleteInvestment } from "./actions";

const INV_LABELS: Record<string, string> = {
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
  const [list, ents] = await Promise.all([listInvestments(), listEntities()]);
  const totalInvested = list.reduce((s, i) => s + Number(i.invested), 0);
  const totalCurrent = list.reduce((s, i) => s + Number(i.currentValue), 0);
  const gain = totalCurrent - totalInvested;
  const gainPct = totalInvested ? (gain / totalInvested) * 100 : 0;
  const monthlySip = list.reduce((s, i) => s + Number(i.sipAmount ?? 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] max-w-6xl">
      <div className="space-y-4">
        {list.length > 0 && (
          <div className="grid sm:grid-cols-4 gap-3">
            <Stat label="Invested" value={formatMoney(totalInvested)} />
            <Stat label="Current value" value={formatMoney(totalCurrent)} />
            <Stat label="Gain" value={`${formatMoney(gain)} (${formatPct(gainPct)})`} />
            <Stat label="Monthly SIP" value={formatMoney(monthlySip)} />
          </div>
        )}

        {list.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No investments yet. Add SIPs, stocks, gold, EPF, PPF — manual valuation for now.
            </CardContent>
          </Card>
        ) : (
          list.map((i) => {
            const g = Number(i.currentValue) - Number(i.invested);
            return (
              <Card key={i.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="size-4 text-[hsl(var(--chart-investment))]" />
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">{i.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {INV_LABELS[i.kind]} · {i.entityName}
                        </p>
                      </div>
                    </div>
                    <form action={deleteInvestment}>
                      <input type="hidden" name="id" value={i.id} />
                      <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <Field label="Invested" value={formatMoney(Number(i.invested))} />
                  <Field label="Current value" value={formatMoney(Number(i.currentValue))} />
                  <Field
                    label="Gain"
                    value={`${formatMoney(g)} (${formatPct(Number(i.invested) ? (g / Number(i.invested)) * 100 : 0)})`}
                  />
                  <Field label="SIP" value={i.sipAmount ? `${formatMoney(Number(i.sipAmount))}/mo` : "—"} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Add investment</CardTitle>
        </CardHeader>
        <CardContent>
          {ents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create an entity first.</p>
          ) : (
            <form action={createInvestment} className="space-y-3">
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
                <Input id="name" name="name" required placeholder="Parag Parikh Flexi Cap, EPF, Gold ETF" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kind">Type</Label>
                <Select id="kind" name="kind" defaultValue="mutual_fund">
                  {Object.entries(INV_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invested">Invested (₹)</Label>
                  <Input id="invested" name="invested" type="number" step="0.01" defaultValue="0" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currentValue">Current value (₹)</Label>
                  <Input id="currentValue" name="currentValue" type="number" step="0.01" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sipAmount">Monthly SIP (₹, optional)</Label>
                <Input id="sipAmount" name="sipAmount" type="number" step="0.01" />
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
        <div className="text-lg font-semibold tabular mt-1">{value}</div>
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
