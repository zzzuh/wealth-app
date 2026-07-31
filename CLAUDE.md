@AGENTS.md

# Wealth — project context for agents

Personal budgeting, credit card, and cash-flow app for a single user. Next.js 16 (App Router,
Turbopack) + TypeScript + Tailwind v4 + Postgres via `pg`. No ORM. Repo: `zzzuh/wealth-app`
(public on GitHub). Deploys to Vercel (Hobby/free tier); database is Supabase Postgres (free tier).

Read this whole file before making changes — several of the notes below exist because a first
attempt broke something non-obviously.

## Mental model

Two loops the whole app is built around:

1. **Budgeting loop**: `pay_schedules` (a recurring cadence template) → `paychecks` (one real
   instance of getting paid) → `budget_allocations` (a **snapshot** of what each budget category
   got for that specific paycheck, generated once at paycheck-creation time) → `transactions`
   (actual spend, tagged to a category + optional paycheck). "Safe to spend" per category/paycheck
   is `allocated_amount - SUM(transactions.amount)`, always computed live at query time — it is
   never stored, specifically so it can't drift out of sync.
2. **Liquidity loop**: `accounts` (checking/savings, freely editable balances, not a history log —
   editing an account mutates the row in place) and `credit_cards` + `card_statements` (one row per
   billing cycle). "Cash needed by date" sums unpaid statements due by a chosen date — using
   `minimum_payment` if the card's `autopay_type` is `'minimum'`, otherwise the full
   `statement_balance` — and nets it against the sum of checking-type accounts.

**Why allocations are snapshotted, not derived live from `budget_categories`:** editing a
category's amount/percentage must not retroactively rewrite historical paychecks. Only the next
paycheck you record picks up the new numbers.

**Frequency-aware proration** (the newest piece): `budget_categories.frequency` is optional and
only meaningful for `allocation_type = 'fixed'` (percentage categories already scale to whatever
paycheck they're on, so frequency doesn't apply — enforced by a CHECK constraint, and the API
forces it to `NULL` whenever `allocation_type = 'percentage'`). When generating allocations for a
new paycheck, both the category's `frequency` and the paycheck's `pay_schedule.frequency` are
converted to occurrences/year (see `lib/frequency.ts`) and the fixed amount is prorated by that
ratio — e.g. $1200 monthly rent against a biweekly (26/yr) pay schedule allocates **$553.85**, not
a flat half, because there are ~2 more paychecks/year than months. `NULL` frequency = "every
paycheck in full," which is also the fallback when a paycheck has no linked `pay_schedule_id` (we
have no cadence to prorate against, so don't guess).

## Schema (`db/schema.sql`)

Single file, always idempotent, always safe to re-run against any environment (local, prod). This
is the *only* migration mechanism — there is no migration history/versioning system. Patterns used
throughout, follow them for any future schema change:

- `CREATE TABLE IF NOT EXISTS` for new tables.
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for new columns on existing tables.
- For constraints (CHECK, FK) that need to change: `DROP CONSTRAINT IF EXISTS <name>` followed by
  `ADD CONSTRAINT <name> ...` with an explicit name — never rely on Postgres's auto-generated
  constraint names for anything you might need to re-drop later. Two examples already in the file:
  the `transactions_paycheck_id_fkey` and `paychecks_pay_schedule_id_fkey` FKs were both changed to
  `ON DELETE SET NULL` this way (see "Foreign keys" below).
- Data migrations (moving rows from an old table into a new one) go in a `DO $$ ... END $$` block
  guarded so it only runs once (e.g. `IF EXISTS (old table) AND NOT EXISTS (any rows in new
  table)`), immediately followed by `DROP TABLE IF EXISTS <old>`. See the `checking_balance` →
  `accounts` migration for the template.
- Row Level Security is enabled with **zero policies** on every table (`ALTER TABLE x ENABLE ROW
  LEVEL SECURITY;`, nothing else). This app only ever talks to Postgres directly via `pg`,
  authenticated as the `postgres` role, which has `BYPASSRLS` — so RLS has no effect on the app
  itself. What it does do is hard-default-deny Supabase's auto-generated PostgREST/anon API (which
  Supabase exposes on every `public` schema table regardless of whether you use it), since that API
  uses `anon`/`authenticated` roles that do *not* bypass RLS. **Any new table needs this line
  added**, or it'll show up as a Supabase linter warning and — worse — be readable by anyone who
  has the project's public anon key.

**Foreign keys and deletion**: think through "what happens to related rows when this is deleted"
for every new FK. The pattern used everywhere: cascade only for pure ownership (e.g.
`card_statements.card_id ON DELETE CASCADE` — a statement has no existence without its card), and
`ON DELETE SET NULL` for detach-don't-destroy relationships (deleting a paycheck shouldn't delete
the transactions logged against it, deleting a pay schedule shouldn't delete paychecks generated
under it). Getting this wrong either blocks deletes with a FK violation or silently destroys
financial history — both were real bugs caught during development, not hypothetical.

## Non-obvious gotchas (each cost real debugging time — don't reintroduce them)

- **`pg` returns `DATE` columns as JS `Date` objects by default**, not strings, parsed at *local
  server midnight*. This breaks anything expecting `.slice(0, 10)` and risks off-by-one-day display
  bugs depending on the server's timezone. Fixed globally in `lib/db.ts` via
  `types.setTypeParser(types.builtins.DATE, (value) => value)` — every `DATE` column is now a plain
  `"YYYY-MM-DD"` string everywhere in the app. Don't remove this. If you add code that touches a
  date column, assume it's a string.
- **Passwords/secrets with `#` in `.env.local` get silently truncated.** `dotenv` treats an
  unquoted `#` as a comment start. Always wrap generated secrets in double quotes in `.env.local`
  if they contain `#`, or just avoid that character when generating new ones.
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`.** The auth gate lives in `proxy.ts` at the
  project root, exporting a function named `proxy` (not `middleware`). If you see a "must export a
  function named `proxy`" error after an edit, check you didn't recreate the old filename.
- **Server Components cannot pass closures to Client Components as props** (React Server
  Components can only pass serializable props across that boundary). Every delete button
  (`Delete*Button.tsx`) is therefore its own small `"use client"` wrapper that takes an `id` (a
  plain string) and internally defines its own `fetch` + `router.refresh()` — it is *not* handed an
  `onConfirm` function from the server-rendered page. Follow this pattern for any new
  edit/delete action; don't try to inline a callback from a `page.tsx`.
- **Turbopack HMR can serve stale errors after a file rename or a `.next` cache hiccup** — you may
  see a console/log error referencing a file that no longer exists, or a click silently doing
  nothing. If behavior doesn't match the current code and a fresh `navigate` doesn't fix it, stop
  the dev server, `rm -rf .next`, and restart before assuming there's a real bug.
- **The Browser-automation tool's `read_page` occasionally goes stale mid-interaction** (a modal
  confirm click can appear to no-op, or a page read can show a different route's content than
  what's actually loaded). When a click seems to do nothing, re-`navigate` to the current URL and
  re-`read_page` before concluding there's an app bug — verify anything suspicious directly against
  the database (`node -e "require('dotenv').config(...); ..."` one-liners) before "fixing" code.

## UI conventions

- `lib/ui.ts` is the single source of shared Tailwind class strings (inputs, buttons, table cells,
  section labels, status pills). Reuse these constants for any new form/table; don't hand-roll new
  className strings that duplicate an existing pattern.
- `app/components/Modal.tsx` (native `<dialog>`-based) and `app/components/ConfirmDeleteButton.tsx`
  are the shared building blocks for every edit-modal and delete-confirmation in the app. New
  editable/deletable entities should reuse these, not reinvent a dialog.
- Every entity that's editable/deletable follows the same three-file pattern per page:
  `EditXButton.tsx` (modal + PATCH), `DeleteXButton.tsx` (wraps `ConfirmDeleteButton`, calls
  DELETE), wired into the page's table with `Edit`/`Delete` actions in the last column.
- Design language: flat surfaces (no boxed borders), `bg-slate-50` for form/stat panels, hairline
  `border-slate-100` dividers for tables, `tabular-nums` on all money figures, red/emerald for
  negative/positive amounts, amber/emerald pills for unpaid/paid status. No dark mode — the
  create-next-app default dark-mode media query was deliberately removed from `globals.css`
  because it wasn't designed for; don't re-add a `prefers-color-scheme: dark` block without
  actually designing a dark variant.

## Auth

Single seeded user (no signup flow). bcrypt password hash + signed JWT session cookie (`jose`).
`proxy.ts` gates every route except `/login` and `/api/auth/login`. `lib/auth.ts` /
`lib/current-user.ts` handle session creation/reading. To create or reset the admin login, set
`ADMIN_EMAIL`/`ADMIN_PASSWORD` in the relevant `.env.local` (or as inline env vars for a remote DB)
and run `npm run seed` — it's an upsert (`ON CONFLICT (email) DO UPDATE`), safe to re-run.

## Commands

```bash
npm run dev          # Turbopack dev server, http://localhost:3000
npm run build         # production build
npm run db:migrate    # applies db/schema.sql against $DATABASE_URL (idempotent)
npm run seed          # creates/updates the single admin user from $ADMIN_EMAIL/$ADMIN_PASSWORD
npx tsc --noEmit       # typecheck — run before considering any change done
npx eslint .           # lint — run before considering any change done
```

`db:migrate` and `seed` load `.env.local` via `dotenv` by default. To target a different database
(e.g. production) without touching `.env.local`, prefix the command with an inline env var instead
of editing any file — e.g. on this machine that looked like:
`DATABASE_URL="postgres://..." npm run db:migrate`. **Never hardcode a production connection
string or the admin password into a tracked file** — this repo is public.

## Local dev environment (this machine)

Local Postgres 17, Node 20 LTS, and the GitHub CLI were installed via `winget` specifically to
build this project (none were present before). `.env.local` (gitignored) points `DATABASE_URL` at
`localhost:5432/wealth_app`. `.claude/launch.json` in the **parent** directory
(`C:\Users\zejun\Desktop\claude-code\.claude\launch.json`, not this repo) is what
`preview_start`/the Browser tool uses to run `npm run dev` for this project via
`npm --prefix <path-to-this-repo> run dev` — it lives outside this repo because the harness's
working directory is the parent folder.

## Deployment

Vercel (Hobby/free) + Supabase Postgres (free tier, pooled "Transaction" connection string on port
`6543` — not the direct 5432 string, since serverless functions need connection pooling). Required
env vars on Vercel: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — generate fresh
values for production, don't reuse local dev secrets. Run `npm run db:migrate` then `npm run seed`
against the production database once before first use (and again after any schema change — see
Commands above for how to target it without touching `.env.local`). Supabase free-tier projects
auto-pause after a week of inactivity; the Supabase dashboard's "Restore" button un-pauses in about
a minute with no data loss.

## Scope: what's built vs. deliberately deferred

Built: budgeting (pay schedules, paychecks, frequency-aware category allocations, transactions,
safe-to-spend), credit cards (statements, cash-needed-by-date), multi-account tracking
(checking/savings, editable/deletable), edit + delete everywhere with confirm dialogs.

Deliberately out of scope so far (per the original schema doc's suggested build order): linked
bank/investment accounts via Plaid, and any real-time balance sync — everything is manual entry.
Don't assume a Plaid integration exists or half-build one without it being explicitly requested;
the `accounts`/`credit_cards` tables were designed to be extended for it later, not replaced.

## Testing expectations

There is no automated test suite. Verification for any change has been: `npx tsc --noEmit` +
`npx eslint .` clean, then an actual browser walkthrough of the affected flow via the Browser tool
(`preview_start` → navigate → interact → `get_page_text`/`read_page` to confirm, not just visual
screenshots) — including checking real numbers (allocation math, prorated amounts, cash-needed
totals) against a hand-computed expected value, not just "the page loaded." Continue that standard
for new work; don't mark something done off a green typecheck alone when the change affects
user-facing behavior or money math.
