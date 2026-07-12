"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { accounts, entities, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const KINDS = ["income", "expense", "transfer"] as const;

async function adjustBalance(accountId: string, delta: number) {
  await db
    .update(accounts)
    .set({ currentBalance: sql`${accounts.currentBalance} + ${delta}` })
    .where(eq(accounts.id, accountId));
}

export async function createTransaction(formData: FormData) {
  const u = await requireUser();
  const kind = String(formData.get("kind") ?? "expense") as (typeof KINDS)[number];
  if (!KINDS.includes(kind)) return;

  const accountId = String(formData.get("accountId"));
  const toAccountId = String(formData.get("toAccountId") ?? "") || null;
  const amount = Math.abs(Number(formData.get("amount") ?? 0));
  if (!amount) return;

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const payee = String(formData.get("payee") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const occurredAtStr = String(formData.get("occurredAt") ?? "");
  const occurredAt = occurredAtStr ? new Date(occurredAtStr) : new Date();
  const isFlatShared = formData.get("isFlatShared") === "on" || formData.get("isFlatShared") === "true";
  const rawShare = String(formData.get("flatSharePct") ?? "").trim();
  const flatSharePct = isFlatShared && rawShare ? String(Math.max(0, Math.min(100, Number(rawShare)))) : null;

  // Verify account belongs to user
  const [acct] = await db
    .select({ id: accounts.id, entityId: accounts.entityId })
    .from(accounts)
    .innerJoin(entities, eq(entities.id, accounts.entityId))
    .where(and(eq(accounts.id, accountId), eq(entities.userId, u.id)))
    .limit(1);
  if (!acct) return;

  await db.insert(transactions).values({
    entityId: acct.entityId,
    accountId,
    toAccountId: kind === "transfer" ? toAccountId : null,
    kind,
    amount: String(amount),
    occurredAt,
    categoryId,
    payee,
    description,
    isFlatShared,
    flatSharePct,
  });

  // Update account balances
  if (kind === "income") {
    await adjustBalance(accountId, amount);
  } else if (kind === "expense") {
    await adjustBalance(accountId, -amount);
  } else if (kind === "transfer" && toAccountId) {
    await adjustBalance(accountId, -amount);
    await adjustBalance(toAccountId, amount);
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function deleteTransaction(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  const [t] = await db
    .select()
    .from(transactions)
    .innerJoin(entities, eq(entities.id, transactions.entityId))
    .where(and(eq(transactions.id, id), eq(entities.userId, u.id)))
    .limit(1);
  if (!t) return;

  const txn = t.transactions;
  const amount = Number(txn.amount);
  if (txn.kind === "income") {
    await adjustBalance(txn.accountId, -amount);
  } else if (txn.kind === "expense") {
    await adjustBalance(txn.accountId, amount);
  } else if (txn.kind === "transfer" && txn.toAccountId) {
    await adjustBalance(txn.accountId, amount);
    await adjustBalance(txn.toAccountId, -amount);
  }
  await db.delete(transactions).where(eq(transactions.id, id));
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}
