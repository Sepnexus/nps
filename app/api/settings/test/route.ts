import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { testConnection } from "@/lib/ai";

export async function POST() {
  const u = await requireUser().catch(() => null);
  if (!u) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const key = u.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  const model = u.openaiModel?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-5";
  if (!key) return NextResponse.json({ ok: false, error: "No API key set" }, { status: 400 });
  const res = await testConnection(key, model);
  return NextResponse.json(res);
}
