import OpenAI from "openai";
import { requireUser } from "@/lib/auth";

export const DEFAULT_CHAT_MODEL = "gpt-5";
export const DEFAULT_VISION_MODEL = "gpt-5";

interface AISettings {
  apiKey: string;
  chatModel: string;
  visionModel: string;
}

/**
 * Resolves AI settings from the current user record first, falling back to env vars.
 * Called from server-side routes / actions.
 */
export async function resolveAISettings(): Promise<AISettings> {
  const u = await requireUser();
  const apiKey = u.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Add it in Settings, or set OPENAI_API_KEY in the environment.",
    );
  }
  return {
    apiKey,
    chatModel: u.openaiModel?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_CHAT_MODEL,
    visionModel: u.openaiVisionModel?.trim() || process.env.OPENAI_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL,
  };
}

function client(apiKey: string) {
  return new OpenAI({ apiKey });
}

export interface ParsedReceipt {
  merchant: string;
  total: number;
  currency: string;
  date: string | null;
  category_guess: string;
  items: { name: string; qty: number | null; price: number | null }[];
  confidence: "low" | "medium" | "high";
}

/**
 * Ask GPT with vision to extract structured data from a receipt image (base64 data URL).
 */
export async function parseReceiptImage(dataUrl: string): Promise<ParsedReceipt> {
  const s = await resolveAISettings();
  const sys = `You are a receipt OCR + structuring service. Given a photo or screenshot of a receipt, invoice, or bill, return strict JSON in this shape and nothing else:
{
  "merchant": string,
  "total": number,
  "currency": string,
  "date": string | null,
  "category_guess": string,
  "items": [ { "name": string, "qty": number | null, "price": number | null } ],
  "confidence": "low" | "medium" | "high"
}
For Indian receipts, default currency to "INR". If the image is not a receipt, set total to 0, confidence "low", and put an empty items array.`;
  const completion = await client(s.apiKey).chat.completions.create({
    model: s.visionModel,
    response_format: { type: "json_object" },
    temperature: 0,
    messages: [
      { role: "system", content: sys },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract this receipt." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as ParsedReceipt;
}

/**
 * Chat completion for the assistant. Caller provides messages; system prompt is
 * built by the caller (it needs the user's data context).
 */
export async function chat(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const s = await resolveAISettings();
  const completion = await client(s.apiKey).chat.completions.create({
    model: s.chatModel,
    temperature: 0.3,
    messages,
  });
  return completion.choices[0]?.message?.content ?? "(no response)";
}

/** Ping OpenAI with the given key/model to verify it works. */
export async function testConnection(apiKey: string, model: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await new OpenAI({ apiKey }).chat.completions.create({
      model,
      messages: [{ role: "user", content: "ping" }],
      max_completion_tokens: 5,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
