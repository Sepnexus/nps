"use client";

import { Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface Parsed {
  merchant: string;
  total: number;
  currency: string;
  date: string | null;
  category_guess: string;
  items: { name: string; qty: number | null; price: number | null }[];
  confidence: "low" | "medium" | "high";
}

export function UploadForm() {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError(null);
    setParsed(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/receipts/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setParsed(json.parsed);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed bg-secondary/20 p-8 cursor-pointer hover:bg-secondary/40 transition-colors">
        <input type="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" />
        {status === "uploading" ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm">Uploading and analyzing…</p>
          </>
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Tap to pick a receipt photo</p>
              <p className="text-xs text-muted-foreground">On mobile, opens the camera directly</p>
            </div>
          </>
        )}
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {parsed && (
        <div className="rounded-md border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">{parsed.merchant || "Unknown merchant"}</div>
              <div className="text-xs text-muted-foreground">
                {parsed.date ?? "no date"} · category guess: {parsed.category_guess}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular">{formatMoney(parsed.total, { currency: parsed.currency })}</div>
              <div className="text-xs text-muted-foreground capitalize">Confidence: {parsed.confidence}</div>
            </div>
          </div>
          {parsed.items?.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Items</div>
              <ul className="text-sm space-y-0.5">
                {parsed.items.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{it.qty ? `${it.qty}× ` : ""}{it.name}</span>
                    {it.price !== null && <span className="tabular text-muted-foreground">{formatMoney(it.price)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm">
              <Link
                href={{
                  pathname: "/transactions/new",
                  query: {
                    amount: parsed.total,
                    payee: parsed.merchant,
                    description: `Receipt: ${parsed.merchant}`,
                  },
                }}
              >
                Create transaction
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setParsed(null); setStatus("idle"); }}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
