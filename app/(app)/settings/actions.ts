"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser, hashPassword } from "@/lib/auth";
import { testConnection } from "@/lib/ai";

export async function saveAISettings(formData: FormData) {
  const u = await requireUser();
  const rawKey = String(formData.get("openaiApiKey") ?? "").trim();
  const model = String(formData.get("openaiModel") ?? "").trim() || null;
  const visionModel = String(formData.get("openaiVisionModel") ?? "").trim() || null;

  // Only overwrite the key if the user typed a non-masked value.
  const shouldWriteKey = rawKey && !rawKey.startsWith("••");
  const patch: Record<string, string | null> = {
    openaiModel: model,
    openaiVisionModel: visionModel,
  };
  if (shouldWriteKey) patch.openaiApiKey = rawKey;
  if (rawKey === "") patch.openaiApiKey = null; // explicit clear

  await db.update(users).set(patch).where(eq(users.id, u.id));
  revalidatePath("/settings");
}

export async function saveProfile(formData: FormData) {
  const u = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "").trim() || null;
  await db.update(users).set({ displayName, timezone, updatedAt: new Date() }).where(eq(users.id, u.id));
  revalidatePath("/settings");
}

export async function changePassword(formData: FormData) {
  const u = await requireUser();
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) return;
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, u.id));
  revalidatePath("/settings");
}

export async function testAIConnection(): Promise<{ ok: boolean; error?: string }> {
  const u = await requireUser();
  const key = u.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  const model = u.openaiModel?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-5";
  if (!key) return { ok: false, error: "No API key set." };
  const res = await testConnection(key, model);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
