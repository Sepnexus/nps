import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CHAT_MODEL, getOpenAI } from "@/lib/ai";
import { buildUserContext } from "@/lib/ai-context";

export const runtime = "nodejs";

interface IncomingMsg {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const u = await requireUser().catch(() => null);
  if (!u) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json()) as { messages: IncomingMsg[] };
  if (!Array.isArray(body.messages)) return NextResponse.json({ error: "messages array required" }, { status: 400 });

  const context = await buildUserContext();
  const system = `You are Vault, a personal finance assistant for ${u.displayName ?? u.email}. Be concise, specific, and grounded in the data below. When you make a recommendation, explain the trade-off in one line. Numbers should use the ₹ symbol and Indian comma grouping. Never invent transactions or balances — use only the values provided.

USER FINANCIAL SNAPSHOT:
${context}`;

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    const reply = completion.choices[0]?.message?.content ?? "(no response)";
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
