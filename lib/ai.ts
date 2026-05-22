import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set. Add it to .env.local to enable AI features.");
  _client = new OpenAI({ apiKey });
  return _client;
}

export const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-5";
export const VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-5";

/**
 * Ask GPT-4 Vision to extract structured data from a receipt image (base64 data URL).
 * Returns the parsed JSON or throws on parsing failure.
 */
export async function parseReceiptImage(dataUrl: string): Promise<ParsedReceipt> {
  const client = getOpenAI();
  const sys = `You are a receipt OCR + structuring service. Given a photo or screenshot of a receipt, invoice, or bill, return strict JSON in this shape and nothing else:
{
  "merchant": string,           // best guess of the store / business name
  "total": number,              // final amount paid (in original currency)
  "currency": string,           // ISO 4217 code; assume "INR" for Indian receipts unless clearly different
  "date": string | null,        // ISO yyyy-mm-dd if visible; null otherwise
  "category_guess": string,     // one of: Food & Groceries, Eating Out, Transport, Fuel, Shopping, Subscriptions, Health, Travel, Utilities, Rent, Misc
  "items": [ { "name": string, "qty": number | null, "price": number | null } ],
  "confidence": "low" | "medium" | "high"
}
If the image is not a receipt, set total to 0, confidence "low", and put an empty items array.`;

  const completion = await client.chat.completions.create({
    model: VISION_MODEL,
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

export interface ParsedReceipt {
  merchant: string;
  total: number;
  currency: string;
  date: string | null;
  category_guess: string;
  items: { name: string; qty: number | null; price: number | null }[];
  confidence: "low" | "medium" | "high";
}
