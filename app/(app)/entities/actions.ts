"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { entities } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function createEntity(formData: FormData) {
  const u = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "personal") as "personal" | "company";
  const legalName = String(formData.get("legalName") ?? "").trim() || null;
  const gstin = String(formData.get("gstin") ?? "").trim() || null;
  const pan = String(formData.get("pan") ?? "").trim() || null;
  if (!name) return;
  await db.insert(entities).values({ userId: u.id, name, kind, legalName, gstin, pan }).onConflictDoNothing();
  revalidatePath("/entities");
}

export async function deleteEntity(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  await db.delete(entities).where(and(eq(entities.id, id), eq(entities.userId, u.id)));
  revalidatePath("/entities");
}
