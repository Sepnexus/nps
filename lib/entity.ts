"server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { entities } from "@/db/schema";
import { requireUser } from "@/lib/auth";

/**
 * Returns the user's Personal entity, creating it if missing.
 * Vault is single-book (Personal only) after the redesign — this is the entity
 * that owns every account, transaction, loan, and investment.
 */
export async function getPersonalEntity() {
  const u = await requireUser();
  const [existing] = await db
    .select()
    .from(entities)
    .where(and(eq(entities.userId, u.id), eq(entities.kind, "personal")))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(entities)
    .values({ userId: u.id, name: "Personal", kind: "personal" })
    .returning();
  return created;
}

/** Clean up any lingering company entities (from the old two-book model). */
export async function purgeCompanyEntities() {
  const u = await requireUser();
  await db.delete(entities).where(and(eq(entities.userId, u.id), eq(entities.kind, "company")));
}
