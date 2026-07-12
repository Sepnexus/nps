import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { UploadForm } from "./upload-form";

export default async function ReceiptsPage() {
  const u = await requireUser();
  const list = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, u.id))
    .orderBy(desc(receipts.createdAt))
    .limit(30);

  const aiKeyMissing = !u.openaiApiKey && !process.env.OPENAI_API_KEY;

  return (
    <div className="max-w-[720px]">
      <PageHeader
        eyebrow="Capture"
        title="Receipts"
        subtitle="Snap or upload — GPT-5 vision extracts merchant, total, and line items."
      />

      <Card className="p-6 mb-4">
        {aiKeyMissing ? (
          <div className="rounded-[10px] border border-[hsl(var(--accent-terra))] bg-[rgba(180,85,47,0.08)] p-4 text-[13px]">
            <strong>OpenAI API key not set.</strong> Add one in <a className="underline" href="/settings">Settings</a> to enable receipt AI.
          </div>
        ) : (
          <UploadForm />
        )}
      </Card>

      {list.length > 0 && (
        <Card>
          <div className="p-5 border-b border-[hsl(var(--border-soft))]">
            <h2 className="text-[14px] font-semibold">History</h2>
          </div>
          <ul className="divide-y divide-[hsl(var(--border-soft))]">
            {list.map((r) => {
              const parsed = r.aiParsed as { merchant?: string; total?: number } | null;
              return (
                <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold truncate">{parsed?.merchant ?? "—"}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("en-IN")} · {r.status}
                      {r.errorMessage ? ` · ${r.errorMessage}` : ""}
                    </div>
                  </div>
                  {parsed?.total ? (
                    <span className="tnum text-[14px] font-semibold">{formatMoney(parsed.total)}</span>
                  ) : (
                    <span className="text-[11.5px] text-muted-foreground">—</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
