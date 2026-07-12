"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { accounts, entities } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getPersonalEntity } from "@/lib/entity";

const ACCOUNT_KINDS = ["bank", "cash", "credit_card", "wallet", "investment", "loan", "asset"] as const;

export async function createAccount(formData: FormData) {
  await requireUser();
  const ent = await getPersonalEntity();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "bank") as (typeof ACCOUNT_KINDS)[number];
  if (!ACCOUNT_KINDS.includes(kind) || !name) return;
  const institution = String(formData.get("institution") ?? "").trim() || null;
  const opening = String(formData.get("openingBalance") ?? "0").trim() || "0";
  const creditLimit = String(formData.get("creditLimit") ?? "").trim() || null;

  await db.insert(accounts).values({
    entityId: ent.id,
    name,
    kind,
    institution,
    openingBalance: opening,
    currentBalance: opening,
    creditLimit,
  });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccount(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .innerJoin(entities, eq(entities.id, accounts.entityId))
    .where(and(eq(accounts.id, id), eq(entities.userId, u.id)))
    .limit(1);
  if (!row) return;
  await db.delete(accounts).where(eq(accounts.id, id));
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
