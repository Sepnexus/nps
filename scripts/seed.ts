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
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../db/schema";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
async function hash(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `s1$${salt.toString("hex")}$${key.toString("hex")}`;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Groceries",
  "Eating Out",
  "Rent",
  "Utilities",
  "Transport",
  "Fuel",
  "Shopping",
  "Subscriptions",
  "Health",
  "Travel",
  "Family Support",
  "EMI",
  "Insurance",
  "Misc",
];
const DEFAULT_INCOME_CATEGORIES = ["Salary", "Weekly Income", "Side Income", "Interest", "Dividend", "Other Income"];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const email = process.env.SEED_EMAIL ?? "akshay@sepnexus.com";
  const password = process.env.SEED_PASSWORD ?? "changeme123";

  // user — upsert and ALWAYS set password to SEED_PASSWORD when provided.
  // This makes the seed idempotent and lets you reset the password by re-running
  // with a new SEED_PASSWORD env var.
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

  // entities
  await db
    .insert(schema.entities)
    .values([
      { userId: user.id, name: "Personal", kind: "personal" },
      { userId: user.id, name: "Sepnexus", kind: "company" },
    ])
    .onConflictDoNothing();

  // categories
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await db.insert(schema.categories).values({ userId: user.id, name, kind: "expense" }).onConflictDoNothing();
  }
  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await db.insert(schema.categories).values({ userId: user.id, name, kind: "income" }).onConflictDoNothing();
  }

  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
