import { readFileSync } from "node:fs";
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(f, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../db/schema";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
async function hash(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `s1$${salt.toString("hex")}$${key.toString("hex")}`;
}

// Categories are grouped so the transaction form can visually separate flat-share
// buckets from personal buckets.
const EXPENSE_CATEGORIES = [
  "Food & Groceries",
  "Eating Out",
  "Transport",
  "Fuel",
  "Shopping",
  "Subscriptions",
  "Health",
  "Travel",
  "Entertainment",
  "Family Support",
  "EMI",
  "Insurance",
  "Personal Care",
  "Misc",
];

const FLAT_EXPENSE_CATEGORIES = [
  "Flat — Rent",
  "Flat — Utilities",
  "Flat — Internet",
  "Flat — Groceries",
  "Flat — Maintenance",
  "Flat — Repairs",
  "Flat — Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Weekly Income",
  "Side Income",
  "Interest",
  "Dividend",
  "Other Income",
];

const FLAT_INCOME_CATEGORIES = [
  "Flatmate Contribution",
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const email = process.env.SEED_EMAIL ?? "akshay@sepnexus.com";
  const password = process.env.SEED_PASSWORD ?? "changeme123";

  // user — always upsert password so re-running is the reset command
  const passwordHash = await hash(password);
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email, passwordHash, displayName: "Akshay" })
      .returning();
    console.log("Created user:", email);
  } else {
    await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
    console.log("Updated password for existing user:", email);
  }

  // Personal-only entity. Any legacy Sepnexus entity from earlier is removed.
  await db
    .delete(schema.entities)
    .where(and(eq(schema.entities.userId, user.id), eq(schema.entities.kind, "company")));
  await db
    .insert(schema.entities)
    .values({ userId: user.id, name: "Personal", kind: "personal" })
    .onConflictDoNothing();

  // categories
  for (const name of [...EXPENSE_CATEGORIES, ...FLAT_EXPENSE_CATEGORIES]) {
    await db.insert(schema.categories).values({ userId: user.id, name, kind: "expense" }).onConflictDoNothing();
  }
  for (const name of [...INCOME_CATEGORIES, ...FLAT_INCOME_CATEGORIES]) {
    await db.insert(schema.categories).values({ userId: user.id, name, kind: "income" }).onConflictDoNothing();
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
