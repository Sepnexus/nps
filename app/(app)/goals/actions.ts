"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function createGoal(formData: FormData) {
  const u = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = String(formData.get("targetAmount") ?? "0");
  const currentAmount = String(formData.get("currentAmount") ?? "0");
  const targetDateStr = String(formData.get("targetDate") ?? "").trim() || null;
  const monthlyContribution = String(formData.get("monthlyContribution") ?? "").trim() || null;
  const priority = Number(formData.get("priority") ?? 3);
  if (!name) return;
  await db.insert(goals).values({
    userId: u.id,
    name,
    targetAmount,
    currentAmount,
    targetDate: targetDateStr,
    monthlyContribution,
    priority,
  });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteGoal(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, u.id)));
  revalidatePath("/goals");
}

export async function updateGoalProgress(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  const currentAmount = String(formData.get("currentAmount") ?? "0");
  await db.update(goals).set({ currentAmount }).where(and(eq(goals.id, id), eq(goals.userId, u.id)));
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
