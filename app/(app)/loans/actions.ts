"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { entities, loanSchedule, loans } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { amortization, emi } from "@/lib/finance";

const KINDS = ["personal", "home", "vehicle", "education", "credit_card", "other"] as const;

export async function createLoan(formData: FormData) {
  const u = await requireUser();
  const entityId = String(formData.get("entityId"));
  const [ent] = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.id, entityId), eq(entities.userId, u.id)))
    .limit(1);
  if (!ent) return;

  const name = String(formData.get("name") ?? "").trim();
  const lender = String(formData.get("lender") ?? "").trim() || null;
  const kind = String(formData.get("kind") ?? "personal") as (typeof KINDS)[number];
  const principal = Number(formData.get("principal") ?? 0);
  const interestRate = Number(formData.get("interestRate") ?? 0);
  const tenureMonths = Number(formData.get("tenureMonths") ?? 0);
  const startDateStr = String(formData.get("startDate") ?? new Date().toISOString().slice(0, 10));

  if (!name || !principal || !interestRate || !tenureMonths) return;

  const emiAmount = emi(principal, interestRate, tenureMonths);
  const startDate = new Date(startDateStr);
  const firstDueDate = new Date(startDate);
  firstDueDate.setMonth(firstDueDate.getMonth() + 1);

  const [loan] = await db
    .insert(loans)
    .values({
      entityId,
      name,
      kind,
      lender,
      principal: String(principal),
      outstanding: String(principal),
      interestRate: String(interestRate),
      tenureMonths,
      emi: String(emiAmount.toFixed(2)),
      startDate: startDateStr,
      firstDueDate: firstDueDate.toISOString().slice(0, 10),
    })
    .returning();

  // Generate amortization schedule
  const rows = amortization(principal, interestRate, tenureMonths);
  const dueDate = new Date(firstDueDate);
  for (const r of rows) {
    await db.insert(loanSchedule).values({
      loanId: loan.id,
      installmentNo: r.installmentNo,
      dueDate: dueDate.toISOString().slice(0, 10),
      emi: r.emi.toFixed(2),
      principalComponent: r.principal.toFixed(2),
      interestComponent: r.interest.toFixed(2),
      balanceAfter: r.balance.toFixed(2),
    });
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function deleteLoan(formData: FormData) {
  const u = await requireUser();
  const id = String(formData.get("id"));
  const [row] = await db
    .select({ id: loans.id })
    .from(loans)
    .innerJoin(entities, eq(entities.id, loans.entityId))
    .where(and(eq(loans.id, id), eq(entities.userId, u.id)))
    .limit(1);
  if (!row) return;
  await db.delete(loans).where(eq(loans.id, id));
  revalidatePath("/loans");
}
