# Vault — Personal + Company Finance OS

A self-hosted, single-user finance application that tracks every rupee in and out across personal and business books, manages loans and investments, projects goals like financial independence, and uses AI (OpenAI) to OCR receipts and answer questions about your own data.

## Stack

- **Next.js 15** (App Router, Server Actions) — full-stack in one repo
- **PostgreSQL + Drizzle ORM** — strict, type-safe schema
- **Tailwind + shadcn/ui** — fast, clean, mobile-first
- **OpenAI** (GPT-4o + Vision) — receipt OCR and assistant
- **PWA** — installable on phone, camera capture
- **Docker Compose** — one command on your server

## Domain

- **Entities** — Personal, Company (extensible)
- **Accounts** — bank, cash, card, wallet, investment
- **Transactions** — income, expense, transfer; category tree
- **Loans** — EMI schedule, prepayments, amortization
- **Investments** — SIPs, gold, silver, equity; current value
- **Goals** — target, deadline, monthly required, progress
- **Income Sources** — salary, weekly, family, other
- **Receipts** — uploaded image, AI-extracted line items
- **Insights** — periodic AI-generated observations

## Local dev

```bash
pnpm install
docker compose up -d db
pnpm db:push        # apply schema to local Postgres
pnpm db:seed        # optional starter data
pnpm dev            # http://localhost:3000
```

## Production (self-host)

```bash
cp .env.example .env
# fill in SESSION_SECRET and OPENAI_API_KEY
docker compose --profile prod up -d --build
# app at :3000, db at :5433
```

## Phases

- **P1 (current)** — schema, auth, entities, accounts, manual transactions, dashboard
- **P2** — loans, investments, goals, AI receipt OCR, AI assistant
- **P3** — PWA polish, mobile capture flow, backups, multi-currency
