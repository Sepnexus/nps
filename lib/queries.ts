"server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, categories, entities, goals, investments, loans, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function listEntities() {
  const u = await requireUser();
  return db.select().from(entities).where(eq(entities.userId, u.id)).orderBy(entities.kind, entities.name);
}

export async function listAccounts() {
  const u = await requireUser();
  return db
    .select({
      id: accounts.id,
      entityId: accounts.entityId,
      entityName: entities.name,
      name: accounts.name,
      kind: accounts.kind,
      institution: accounts.institution,
      currentBalance: accounts.currentBalance,
      currency: accounts.currency,
      creditLimit: accounts.creditLimit,
      isArchived: accounts.isArchived,
    })
    .from(accounts)
    .innerJoin(entities, eq(entities.id, accounts.entityId))
    .where(and(eq(entities.userId, u.id), eq(accounts.isArchived, false)))
    .orderBy(entities.kind, accounts.name);
}

export async function listCategories(kind?: "income" | "expense") {
  const u = await requireUser();
  const conds = [eq(categories.userId, u.id), eq(categories.isArchived, false)];
  if (kind) conds.push(eq(categories.kind, kind));
  return db.select().from(categories).where(and(...conds)).orderBy(categories.kind, categories.name);
}

export async function listTransactions(limit = 100) {
  const u = await requireUser();
  return db
    .select({
      id: transactions.id,
      kind: transactions.kind,
      amount: transactions.amount,
      occurredAt: transactions.occurredAt,
      payee: transactions.payee,
      description: transactions.description,
      entityName: entities.name,
      accountName: accounts.name,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(entities, eq(entities.id, transactions.entityId))
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(eq(entities.userId, u.id))
    .orderBy(desc(transactions.occurredAt))
    .limit(limit);
}

/**
 * Aggregate dashboard metrics from real transactions for a given month window.
 * Returns nulls if there's no data — caller falls back to demo data.
 */
export async function dashboardMetrics() {
  const u = await requireUser();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .innerJoin(entities, eq(entities.id, transactions.entityId))
    .where(
      and(
        eq(entities.userId, u.id),
        sql`${transactions.occurredAt} >= ${start.toISOString()}`,
        sql`${transactions.occurredAt} < ${end.toISOString()}`,
      ),
    );

  return {
    income: Number(row?.income ?? 0),
    expense: Number(row?.expense ?? 0),
    count: row?.count ?? 0,
  };
}

export async function listLoans() {
  const u = await requireUser();
  return db
    .select({
      id: loans.id,
      name: loans.name,
      kind: loans.kind,
      lender: loans.lender,
      principal: loans.principal,
      outstanding: loans.outstanding,
      interestRate: loans.interestRate,
      tenureMonths: loans.tenureMonths,
      emi: loans.emi,
      startDate: loans.startDate,
      firstDueDate: loans.firstDueDate,
      isClosed: loans.isClosed,
      entityName: entities.name,
    })
    .from(loans)
    .innerJoin(entities, eq(entities.id, loans.entityId))
    .where(eq(entities.userId, u.id))
    .orderBy(loans.startDate);
}

export async function listInvestments() {
  const u = await requireUser();
  return db
    .select({
      id: investments.id,
      name: investments.name,
      kind: investments.kind,
      symbol: investments.symbol,
      units: investments.units,
      invested: investments.invested,
      currentValue: investments.currentValue,
      sipAmount: investments.sipAmount,
      entityName: entities.name,
    })
    .from(investments)
    .innerJoin(entities, eq(entities.id, investments.entityId))
    .where(and(eq(entities.userId, u.id), eq(investments.isActive, true)))
    .orderBy(investments.kind, investments.name);
}

export async function listGoals() {
  const u = await requireUser();
  return db.select().from(goals).where(eq(goals.userId, u.id)).orderBy(goals.priority);
}

export async function netWorth() {
  const u = await requireUser();
  const rows = await db
    .select({ kind: accounts.kind, balance: accounts.currentBalance })
    .from(accounts)
    .innerJoin(entities, eq(entities.id, accounts.entityId))
    .where(and(eq(entities.userId, u.id), eq(accounts.isArchived, false)));

  let assets = 0;
  let liabilities = 0;
  for (const r of rows) {
    const n = Number(r.balance);
    if (r.kind === "credit_card" || r.kind === "loan") liabilities += n;
    else assets += n;
  }
  return { assets, liabilities, net: assets - liabilities };
}
