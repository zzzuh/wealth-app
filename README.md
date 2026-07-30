# Wealth

Personal budgeting, credit card tracking, and cash-flow dashboard. Single-user app built with Next.js (App Router), TypeScript, Tailwind CSS, and Postgres.

This build covers the first two phases of the schema's suggested build order:

1. Budgeting: pay schedules, paychecks, budget categories, per-paycheck allocations, transactions, and a live "safe to spend" calculation.
2. Credit cards: cards, statements, and the "cash needed by date" projection (sums unpaid statement balances or minimum payments, depending on each card's autopay setting, against your checking balance).

Linked bank/investment accounts (Plaid) are out of scope for this build — see `db/schema.sql`'s companion doc for that phase.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript + Tailwind CSS
- Postgres via the `pg` driver (works with a local Postgres, Vercel Postgres, or Supabase)
- Auth: bcrypt-hashed password + a signed JWT session cookie (`jose`). One seeded user, no signup flow.

## Setup

### 1. Provision Postgres

Any Postgres 14+ works — local, [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), or [Supabase](https://supabase.com/). Grab the connection string.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=postgres://user:password@host:5432/wealth_app
AUTH_SECRET=a-long-random-string   # e.g. `openssl rand -hex 32`
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password
```

### 3. Install dependencies

```bash
npm install
```

### 4. Apply the schema and seed your account

```bash
npm run db:migrate
npm run seed
```

`db:migrate` applies `db/schema.sql` (idempotent — safe to re-run). `seed` creates (or updates) the single admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with the admin credentials from step 2.

## How the numbers work

- **Safe to spend** per category = `allocated_amount - SUM(transactions.amount)` for that paycheck/category pair. Computed live at query time, never stored, so it can't drift.
- **Recording a paycheck** snapshots your current active `budget_categories` into `budget_allocations` for that paycheck — later edits to a category's amount/percentage don't retroactively change past paychecks.
- **Cash needed by date** sums, across all unpaid card statements due on or before the chosen date, either the `minimum_payment` (if the card has autopay set to "minimum") or the full `statement_balance` (otherwise). That total is compared against the sum of your checking-type accounts to show a surplus or shortfall.
- **Checking / savings totals** are the sum of your `accounts` rows by `type`. Each account is a single editable/deletable row (not a balance history log) — editing it updates the balance in place.

## Deploying

Push to Vercel (or any Node host) with the same environment variables set, pointing `DATABASE_URL` at your production Postgres. Run `npm run db:migrate` and `npm run seed` once against that database before first use.
