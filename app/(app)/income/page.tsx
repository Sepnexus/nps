import { and, eq } from "drizzle-orm";
import { PiggyBank } from "lucide-react";
import { db } from "@/db";
import { entities, incomeSources } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

export default async function IncomePage() {
  const u = await requireUser();
  const list = await db
    .select({
      id: incomeSources.id,
      name: incomeSources.name,
      reliability: incomeSources.reliability,
      frequency: incomeSources.frequency,
      expectedAmount: incomeSources.expectedAmount,
      isActive: incomeSources.isActive,
    })
    .from(incomeSources)
    .innerJoin(entities, eq(entities.id, incomeSources.entityId))
    .where(and(eq(entities.userId, u.id), eq(incomeSources.isActive, true)));

  const total = list.reduce((s, i) => {
    const n = Number(i.expectedAmount ?? 0);
    switch (i.frequency) {
      case "monthly":
        return s + n;
      case "weekly":
        return s + n * 4.33;
      case "daily":
        return s + n * 30;
      case "yearly":
        return s + n / 12;
      default:
        return s;
    }
  }, 0);

  return (
    <div className="max-w-[760px]">
      <PageHeader eyebrow="Inflow" title="Income sources" />

      <div className="rounded-lg bg-dark-panel text-dark-panel-foreground p-5 mb-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.12em] text-dark-panel-muted">TOTAL MONTHLY (EST.)</div>
          <div className="num-serif text-[32px] mt-1.5">{formatMoney(total, { compact: true })}</div>
        </div>
        <div className="text-right text-[12px] text-dark-panel-muted">
          {list.length} active {list.length === 1 ? "source" : "sources"}
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="p-8 text-center text-[13px] text-muted-foreground">
          No income sources yet. Add salary, weekly clients, side projects to help Vault classify inflows.
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="chip-income w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0">
                  <PiggyBank className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">{s.name}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">
                    {s.reliability} · {s.frequency}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="tnum text-[16px] font-semibold text-income">
                  {s.expectedAmount ? formatMoney(Number(s.expectedAmount)) : "—"}
                </div>
                <div className="text-[11px] text-muted-foreground">{s.frequency}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[12px] text-muted-foreground mt-6">
        (Editing income sources moves to Settings in the next update — for now, the app auto-classifies inflows by category.)
      </p>
    </div>
  );
}
