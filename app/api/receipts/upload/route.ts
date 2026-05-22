import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { parseReceiptImage } from "@/lib/ai";

const STORAGE_DIR = process.env.RECEIPT_STORAGE_DIR ?? "./storage/receipts";

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const userDir = path.join(STORAGE_DIR, user.id);
  await mkdir(userDir, { recursive: true });
  await writeFile(path.join(userDir, filename), buf);
  const relPath = path.join(user.id, filename);

  const [row] = await db
    .insert(receipts)
    .values({
      userId: user.id,
      filePath: relPath,
      mimeType: file.type || "image/jpeg",
      sizeBytes: buf.length,
      status: "processing",
    })
    .returning();

  const { eq } = await import("drizzle-orm");
  try {
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
    const parsed = await parseReceiptImage(dataUrl);
    await db
      .update(receipts)
      .set({ status: "parsed", aiParsed: parsed, processedAt: new Date() })
      .where(eq(receipts.id, row.id));
    return NextResponse.json({ id: row.id, parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(receipts)
      .set({ status: "failed", errorMessage: message, processedAt: new Date() })
      .where(eq(receipts.id, row.id));
    return NextResponse.json({ id: row.id, error: message }, { status: 500 });
  }
}
