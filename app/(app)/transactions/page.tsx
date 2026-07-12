import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Home, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { listTransactions } from "@/lib/queries";
import { formatMoney } from "@/lib/utils";
import { deleteTransaction } from "./actions";

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  transfer: ArrowLeftRight,
};
const KIND_CHIP: Record<string, string> = {
  income: "chip-income",
  expense: "chip-expense",
  transfer: "chip-flat",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const all = await listTransactions(200);
  const filter = sp.filter ?? "all";
  const list = all.filter((t) => {
    if (filter === "income") return t.kind === "income";
    if (filter === "expense") return t.kind === "expense";
    if (filter === "flat") return t.categoryName?.toLowerCase().includes("flat");
    return true;
  });

  const filters = [
    { id: "all", label: "All" },
    { id: "income", label: "Income" },
    { id: "expense", label: "Expense" },
    { id: "flat", label: "Flat share" },
  ];

  return (
    <div className="max-w-[820px]">
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        actions={
          <Button size="sm" variant="primary" asChild>
            <Link href="/transactions/new">
              <Plus className="w-3.5 h-3.5" /> Add
            </Link>
          </Button>
        }
      />

      <div className="mb-4 inline-flex gap-0.5 bg-secondary rounded-[11px] p-1">
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <Link
              key={f.id}
              href={f.id === "all" ? "/transactions" : `/transactions?filter=${f.id}`}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-mono uppercase tracking-wider transition ${
                active ? "bg-white text-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-muted-foreground">
            {all.length === 0 ? (
              <>
                No transactions yet. <Link className="underline" href="/transactions/new">Add your first</Link>.
              </>
            ) : (
              "No transactions match this filter."
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border-soft))]">
            {list.map((t) => {
              const Icon = KIND_ICON[t.kind] ?? ArrowLeftRight;
              const chip = KIND_CHIP[t.kind] ?? "chip-flat";
              const isFlat = t.categoryName?.toLowerCase().includes("flat");
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0 ${chip}`}>
                      <Icon className="w-[17px] h-[17px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate flex items-center gap-1.5">
                        {t.payee || t.description || t.categoryName || "Untitled"}
                        {isFlat && (
                          <span className="chip-flat text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded">
                            <Home className="w-2.5 h-2.5 inline mr-0.5" />flat
                          </span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {new Date(t.occurredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}
                        {t.accountName}
                        {t.categoryName ? ` · ${t.categoryName}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`tnum text-[14px] font-semibold ${
                      t.kind === "income" ? "text-income" : t.kind === "expense" ? "text-expense" : ""
                    }`}>
                      {t.kind === "expense" ? "-" : t.kind === "income" ? "+" : ""}
                      {formatMoney(Number(t.amount))}
                    </span>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        aria-label="Delete"
                        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-expense opacity-50 hover:opacity-100 hover:bg-[rgba(199,86,59,0.08)] transition"
                      >
                        <Trash2 className="w-[15px] h-[15px]" />
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
