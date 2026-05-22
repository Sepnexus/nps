"server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, entities, goals, investments, loans, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";

/**
 * Build a concise text snapshot of the user's finances for the AI to ground on.
 * Limits to keep the prompt small and cacheable.
 */
export async function buildUserContext(): Promise<string> {
  const u = await requireUser();

  const ents = await db.select().from(entities).where(eq(entities.userId, u.id));
  const accts = await db
    .select({ name: accounts.name, kind: accounts.kind, balance: accounts.currentBalance, entityId: accounts.entityId })
    .from(accounts)
    .innerJoin(entities, eq(entities.id, accounts.entityId))
    .where(and(eq(entities.userId, u.id), eq(accounts.isArchived, false)));
  const loansList = await db
    .select()
    .from(loans)
    .innerJoin(entities, eq(entities.id, loans.entityId))
    .where(eq(entities.userId, u.id));
  const invList = await db
    .select()
    .from(investments)
    .innerJoin(entities, eq(entities.id, investments.entityId))
    .where(and(eq(entities.userId, u.id), eq(investments.isActive, true)));
  const goalList = await db.select().from(goals).where(eq(goals.userId, u.id));

  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  start.setDate(1);
  const [agg] = await db
    .select({
      income: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      n: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .innerJoin(entities, eq(entities.id, transactions.entityId))
    .where(and(eq(entities.userId, u.id), sql`${transactions.occurredAt} >= ${start.toISOString()}`));

  const fmt = (s: string | number) => "₹" + Number(s).toLocaleString("en-IN");

  const lines: string[] = [];
  lines.push(`USER: ${u.displayName ?? u.email}`);
  lines.push(`BASE CURRENCY: ${u.baseCurrency ?? "INR"} | TIMEZONE: ${u.timezone ?? "Asia/Kolkata"}`);
  lines.push(`\nENTITIES (${ents.length}):`);
  for (const e of ents) lines.push(`  - ${e.name} (${e.kind})`);

  lines.push(`\nACCOUNTS (${accts.length}):`);
  for (const a of accts) lines.push(`  - ${a.name} [${a.kind}] balance ${fmt(a.balance)}`);

  lines.push(`\nLOANS (${loansList.length}):`);
  for (const r of loansList) {
    const l = r.loans;
    lines.push(`  - ${l.name} [${l.kind}] outstanding ${fmt(l.outstanding)} @ ${l.interestRate}% EMI ${fmt(l.emi)}/mo, ${l.tenureMonths} mo total`);
  }

  lines.push(`\nINVESTMENTS (${invList.length}):`);
  for (const r of invList) {
    const i = r.investments;
    const g = Number(i.currentValue) - Number(i.invested);
    lines.push(`  - ${i.name} [${i.kind}] invested ${fmt(i.invested)} current ${fmt(i.currentValue)} gain ${fmt(g)} ${i.sipAmount ? `SIP ${fmt(i.sipAmount)}/mo` : ""}`);
  }

  lines.push(`\nGOALS (${goalList.length}):`);
  for (const g of goalList) lines.push(`  - ${g.name} ${fmt(g.currentAmount)} of ${fmt(g.targetAmount)} target ${g.targetDate ?? "—"}`);

  lines.push(`\nLAST 30 DAYS:`);
  lines.push(`  - Income: ${fmt(agg?.income ?? 0)}`);
  lines.push(`  - Expense: ${fmt(agg?.expense ?? 0)}`);
  lines.push(`  - Transactions: ${agg?.n ?? 0}`);

  return lines.join("\n");
}
