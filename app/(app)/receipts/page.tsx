import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const aiKeyMissing = !process.env.OPENAI_API_KEY;

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Upload a receipt</CardTitle>
        </CardHeader>
        <CardContent>
          {aiKeyMissing ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <strong>OPENAI_API_KEY is not set.</strong> Add it to <code>.env.local</code> to enable receipt AI.
            </div>
          ) : (
            <UploadForm />
          )}
        </CardContent>
      </Card>

      {list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {list.map((r) => {
                const parsed = r.aiParsed as { merchant?: string; total?: number; date?: string } | null;
                return (
                  <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{parsed?.merchant ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString("en-IN")} · {r.status}
                        {r.errorMessage ? ` · ${r.errorMessage}` : ""}
                      </div>
                    </div>
                    {parsed?.total ? (
                      <span className="tabular font-medium">{formatMoney(parsed.total)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
