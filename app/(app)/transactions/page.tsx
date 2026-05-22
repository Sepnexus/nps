import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { listTransactions } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import { deleteTransaction } from "./actions";

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  transfer: ArrowLeftRight,
};

const KIND_COLOR: Record<string, string> = {
  income: "text-[hsl(var(--chart-income))]",
  expense: "text-[hsl(var(--chart-expense))]",
  transfer: "text-muted-foreground",
};

export default async function TransactionsPage() {
  const list = await listTransactions(200);
  if (list.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions yet"
        description="Log income, expenses, and transfers. Use quick-add or upload a receipt for AI to extract details."
        action={
          <Button asChild>
            <Link href="/transactions/new">Add transaction</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Recent</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {list.map((t) => {
              const Icon = KIND_ICON[t.kind] ?? ArrowLeftRight;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`size-4 shrink-0 ${KIND_COLOR[t.kind] ?? ""}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium truncate">
                        <span>{t.payee || t.description || t.categoryName || "—"}</span>
                        {t.categoryName && <span className="text-xs text-muted-foreground">· {t.categoryName}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                        {t.accountName} · {t.entityName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`tabular font-medium ${KIND_COLOR[t.kind] ?? ""}`}>
                      {t.kind === "expense" ? "-" : t.kind === "income" ? "+" : ""}
                      {formatMoney(Number(t.amount))}
                    </span>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
