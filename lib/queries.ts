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

/** Last N months of income and expense totals for the cash-flow chart. */
export async function monthlyHistory(months = 6) {
  const u = await requireUser();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (months - 1));

  const rows = await db
    .select({
      bucket: sql<string>`to_char(date_trunc('month', ${transactions.occurredAt}), 'YYYY-MM')`,
      income: sql<string>`coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${transactions.kind} = 'expense' then ${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .innerJoin(entities, eq(entities.id, transactions.entityId))
    .where(and(eq(entities.userId, u.id), sql`${transactions.occurredAt} >= ${start.toISOString()}`))
    .groupBy(sql`date_trunc('month', ${transactions.occurredAt})`)
    .orderBy(sql`date_trunc('month', ${transactions.occurredAt})`);

  // Fill missing months with zeros
  const byKey = new Map(rows.map((r) => [r.bucket, { income: Number(r.income), expense: Number(r.expense) }]));
  const result: { month: string; income: number; expense: number }[] = [];
  const cursor = new Date(start);
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const r = byKey.get(key) ?? { income: 0, expense: 0 };
    result.push({ month: monthFmt.format(cursor), income: r.income, expense: r.expense });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

/** Current-month expense breakdown by category (top N). */
export async function expenseBreakdown(limit = 8) {
  const u = await requireUser();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const rows = await db
    .select({
      name: sql<string>`coalesce(${categories.name}, 'Uncategorized')`,
      value: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(entities, eq(entities.id, transactions.entityId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(entities.userId, u.id),
        eq(transactions.kind, "expense"),
        sql`${transactions.occurredAt} >= ${start.toISOString()}`,
        sql`${transactions.occurredAt} < ${end.toISOString()}`,
      ),
    )
    .groupBy(categories.name)
    .orderBy(sql`coalesce(sum(${transactions.amount}), 0) desc`)
    .limit(limit);

  return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
}

/** Total monthly EMI burden across active loans. */
export async function totalMonthlyEmi() {
  const u = await requireUser();
  const rows = await db
    .select({ emi: loans.emi })
    .from(loans)
    .innerJoin(entities, eq(entities.id, loans.entityId))
    .where(and(eq(entities.userId, u.id), eq(loans.isClosed, false)));
  return rows.reduce((s, r) => s + Number(r.emi), 0);
}

/** Current investment totals: invested, current value, monthly SIP. */
export async function investmentTotals() {
  const u = await requireUser();
  const rows = await db
    .select({ invested: investments.invested, currentValue: investments.currentValue, sipAmount: investments.sipAmount })
    .from(investments)
    .innerJoin(entities, eq(entities.id, investments.entityId))
    .where(and(eq(entities.userId, u.id), eq(investments.isActive, true)));
  let invested = 0,
    currentValue = 0,
    sip = 0;
  for (const r of rows) {
    invested += Number(r.invested);
    currentValue += Number(r.currentValue);
    sip += Number(r.sipAmount ?? 0);
  }
  return { invested, currentValue, sip };
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
