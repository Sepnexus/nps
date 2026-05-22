import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ===== ENUMS =====
export const entityKindEnum = pgEnum("entity_kind", ["personal", "company"]);
export const accountKindEnum = pgEnum("account_kind", [
  "bank",
  "cash",
  "credit_card",
  "wallet",
  "investment",
  "loan", // virtual account representing outstanding loan principal
  "asset", // gold, silver, real estate (manual valuation)
]);
export const txnKindEnum = pgEnum("txn_kind", ["income", "expense", "transfer"]);
export const txnStatusEnum = pgEnum("txn_status", ["pending", "cleared", "reconciled"]);
export const categoryKindEnum = pgEnum("category_kind", ["income", "expense"]);
export const loanKindEnum = pgEnum("loan_kind", ["personal", "home", "vehicle", "education", "credit_card", "other"]);
export const loanFreqEnum = pgEnum("loan_freq", ["monthly", "quarterly", "yearly"]);
export const investmentKindEnum = pgEnum("investment_kind", [
  "mutual_fund",
  "stock",
  "etf",
  "gold",
  "silver",
  "fd",
  "ppf",
  "epf",
  "nps",
  "crypto",
  "other",
]);
export const goalStatusEnum = pgEnum("goal_status", ["active", "paused", "achieved", "cancelled"]);
export const incomeReliabilityEnum = pgEnum("income_reliability", ["fixed", "variable", "occasional"]);
export const incomeFreqEnum = pgEnum("income_freq", ["monthly", "weekly", "daily", "yearly", "adhoc"]);
export const receiptStatusEnum = pgEnum("receipt_status", ["uploaded", "processing", "parsed", "failed", "linked"]);
export const insightKindEnum = pgEnum("insight_kind", [
  "monthly_summary",
  "anomaly",
  "lifestyle_inflation",
  "goal_progress",
  "tax_reminder",
  "general",
]);

// monetary amounts stored as numeric(18,2); IDs as uuid; dates as date or timestamp
const money = (name: string) => numeric(name, { precision: 18, scale: 2 });

// ===== USERS (single-user app, but modeled for future) =====
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 120 }),
  timezone: varchar("timezone", { length: 64 }).default("Asia/Kolkata"),
  baseCurrency: varchar("base_currency", { length: 3 }).default("INR"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // signed token id
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== ENTITIES (personal / company books) =====
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    kind: entityKindEnum("kind").notNull(),
    legalName: varchar("legal_name", { length: 255 }),
    registrationNo: varchar("registration_no", { length: 64 }),
    gstin: varchar("gstin", { length: 32 }),
    pan: varchar("pan", { length: 16 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userKindIdx: uniqueIndex("entities_user_name_idx").on(t.userId, t.name) }),
);

// ===== ACCOUNTS =====
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  kind: accountKindEnum("kind").notNull(),
  institution: varchar("institution", { length: 120 }),
  accountNumberMasked: varchar("account_number_masked", { length: 32 }),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  openingBalance: money("opening_balance").default("0").notNull(),
  currentBalance: money("current_balance").default("0").notNull(), // denormalized, recalculated on txn write
  creditLimit: money("credit_limit"), // for credit cards
  interestRate: numeric("interest_rate", { precision: 6, scale: 3 }), // for FD/loan accounts
  isArchived: boolean("is_archived").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== CATEGORIES =====
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  kind: categoryKindEnum("kind").notNull(),
  parentId: uuid("parent_id"),
  icon: varchar("icon", { length: 40 }),
  color: varchar("color", { length: 16 }),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== INCOME SOURCES =====
export const incomeSources = pgTable("income_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(), // "Salary", "Weekly client", "Side project"
  reliability: incomeReliabilityEnum("reliability").notNull(),
  frequency: incomeFreqEnum("frequency").notNull(),
  expectedAmount: money("expected_amount"), // typical amount per period
  defaultAccountId: uuid("default_account_id").references(() => accounts.id, { onDelete: "set null" }),
  defaultCategoryId: uuid("default_category_id").references(() => categories.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== TRANSACTIONS =====
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "restrict" }), // for transfers
  kind: txnKindEnum("kind").notNull(),
  amount: money("amount").notNull(), // always positive; sign derived from kind
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  incomeSourceId: uuid("income_source_id").references(() => incomeSources.id, { onDelete: "set null" }),
  loanId: uuid("loan_id"), // FK declared below to avoid circular
  goalId: uuid("goal_id"),
  payee: varchar("payee", { length: 160 }),
  description: text("description"),
  tags: text("tags").array(),
  status: txnStatusEnum("status").default("cleared").notNull(),
  receiptId: uuid("receipt_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== LOANS =====
export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  kind: loanKindEnum("kind").notNull(),
  lender: varchar("lender", { length: 160 }),
  principal: money("principal").notNull(),
  outstanding: money("outstanding").notNull(), // denormalized
  interestRate: numeric("interest_rate", { precision: 6, scale: 3 }).notNull(), // % annual
  tenureMonths: integer("tenure_months").notNull(),
  emi: money("emi").notNull(),
  frequency: loanFreqEnum("frequency").default("monthly").notNull(),
  startDate: date("start_date").notNull(),
  firstDueDate: date("first_due_date").notNull(),
  fromAccountId: uuid("from_account_id").references(() => accounts.id, { onDelete: "set null" }), // EMI auto-debit account
  isClosed: boolean("is_closed").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loanSchedule = pgTable("loan_schedule", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  installmentNo: integer("installment_no").notNull(),
  dueDate: date("due_date").notNull(),
  emi: money("emi").notNull(),
  principalComponent: money("principal_component").notNull(),
  interestComponent: money("interest_component").notNull(),
  balanceAfter: money("balance_after").notNull(),
  paid: boolean("paid").default(false).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidTransactionId: uuid("paid_transaction_id").references(() => transactions.id, { onDelete: "set null" }),
});

export const loanPrepayments = pgTable("loan_prepayments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  amount: money("amount").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  reducesEmi: boolean("reduces_emi").default(false).notNull(), // false = reduces tenure
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  notes: text("notes"),
});

// ===== INVESTMENTS =====
export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  kind: investmentKindEnum("kind").notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  symbol: varchar("symbol", { length: 32 }), // for stocks/ETFs/MF code
  units: numeric("units", { precision: 20, scale: 6 }).default("0").notNull(),
  invested: money("invested").default("0").notNull(), // cumulative cost basis
  currentValue: money("current_value").default("0").notNull(), // manual or API-fed
  lastValuedAt: timestamp("last_valued_at", { withTimezone: true }),
  sipAmount: money("sip_amount"), // if recurring
  sipDayOfMonth: integer("sip_day_of_month"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
});

export const investmentTransactions = pgTable("investment_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentId: uuid("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull(), // buy | sell | dividend | bonus
  units: numeric("units", { precision: 20, scale: 6 }).notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 20, scale: 6 }).notNull(),
  amount: money("amount").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  linkedTransactionId: uuid("linked_transaction_id").references(() => transactions.id, { onDelete: "set null" }),
});

// ===== GOALS =====
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  targetAmount: money("target_amount").notNull(),
  currentAmount: money("current_amount").default("0").notNull(),
  targetDate: date("target_date"),
  monthlyContribution: money("monthly_contribution"),
  priority: integer("priority").default(3).notNull(), // 1..5
  status: goalStatusEnum("status").default("active").notNull(),
  // Optional rule: which accounts/investments count toward this goal
  linkedAccountIds: uuid("linked_account_ids").array(),
  linkedInvestmentIds: uuid("linked_investment_ids").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== RECEIPTS (AI OCR pipeline) =====
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(), // relative to RECEIPT_STORAGE_DIR
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: receiptStatusEnum("status").default("uploaded").notNull(),
  aiRaw: jsonb("ai_raw"), // raw OpenAI response
  aiParsed: jsonb("ai_parsed"), // structured: {merchant, total, currency, items: [{name, qty, price}], date}
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// ===== AI INSIGHTS =====
export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: insightKindEnum("kind").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  data: jsonb("data"), // structured payload backing the insight
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  dismissed: boolean("dismissed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== ASSISTANT CHAT =====
export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(), // user | assistant | system | tool
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== RELATIONS =====
export const usersRelations = relations(users, ({ many }) => ({
  entities: many(entities),
  categories: many(categories),
  goals: many(goals),
  receipts: many(receipts),
  insights: many(insights),
  sessions: many(sessions),
  chatThreads: many(chatThreads),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  user: one(users, { fields: [entities.userId], references: [users.id] }),
  accounts: many(accounts),
  transactions: many(transactions),
  loans: many(loans),
  investments: many(investments),
  incomeSources: many(incomeSources),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  entity: one(entities, { fields: [accounts.entityId], references: [entities.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  entity: one(entities, { fields: [transactions.entityId], references: [entities.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  toAccount: one(accounts, { fields: [transactions.toAccountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  incomeSource: one(incomeSources, { fields: [transactions.incomeSourceId], references: [incomeSources.id] }),
  receipt: one(receipts, { fields: [transactions.receiptId], references: [receipts.id] }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  entity: one(entities, { fields: [loans.entityId], references: [entities.id] }),
  schedule: many(loanSchedule),
  prepayments: many(loanPrepayments),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  entity: one(entities, { fields: [investments.entityId], references: [entities.id] }),
  account: one(accounts, { fields: [investments.accountId], references: [accounts.id] }),
  txns: many(investmentTransactions),
}));

// ===== Types =====
export type User = typeof users.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type LoanScheduleRow = typeof loanSchedule.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type Insight = typeof insights.$inferSelect;
export type IncomeSource = typeof incomeSources.$inferSelect;
