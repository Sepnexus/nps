"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { entities, investments } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getPersonalEntity } from "@/lib/entity";

const KINDS = ["mutual_fund", "stock", "etf", "gold", "silver", "fd", "ppf", "epf", "nps", "crypto", "other"] as const;

export async function createInvestment(formData: FormData) {
  await requireUser();
  const ent = await getPersonalEntity();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "mutual_fund") as (typeof KINDS)[number];
  if (!name || !KINDS.includes(kind)) return;
  const invested = String(formData.get("invested") ?? "0") || "0";
  const currentValue = String(formData.get("currentValue") ?? invested);
  const sipAmount = String(formData.get("sipAmount") ?? "").trim() || null;

  await db.insert(investments).values({
    entityId: ent.id,
    name,
    kind,
    invested,
    currentValue,
    sipAmount,
    lastValuedAt: new Date(),
  });
  revalidatePath("/investments");
  revalidatePath("/dashboard");
}

export async function deleteInvestment(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  const [row] = await db
    .select({ id: investments.id })
    .from(investments)
    .innerJoin(entities, eq(entities.id, investments.entityId))
    .where(and(eq(investments.id, id), eq(entities.userId, u.id)))
    .limit(1);
  if (!row) return;
  await db.delete(investments).where(eq(investments.id, id));
  revalidatePath("/investments");
}

export async function updateInvestmentValue(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  const currentValue = String(formData.get("currentValue") ?? "0");
  const [row] = await db
    .select({ id: investments.id })
    .from(investments)
    .innerJoin(entities, eq(entities.id, investments.entityId))
    .where(and(eq(investments.id, id), eq(entities.userId, u.id)))
    .limit(1);
  if (!row) return;
  await db.update(investments).set({ currentValue, lastValuedAt: new Date() }).where(eq(investments.id, id));
  revalidatePath("/investments");
}
