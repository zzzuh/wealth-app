-- Wealth app schema (core scope: budgeting + credit cards)
-- Postgres. Extensions needed for gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pay_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly','biweekly','semimonthly','monthly')),
  net_amount NUMERIC(12,2) NOT NULL,
  next_pay_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paychecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pay_schedule_id UUID REFERENCES pay_schedules(id),
  pay_date DATE NOT NULL,
  net_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, pay_date)
);

-- Deleting a pay schedule shouldn't be blocked by (or destroy) paychecks
-- already generated under it — just detach them.
ALTER TABLE paychecks DROP CONSTRAINT IF EXISTS paychecks_pay_schedule_id_fkey;
ALTER TABLE paychecks ADD CONSTRAINT paychecks_pay_schedule_id_fkey
  FOREIGN KEY (pay_schedule_id) REFERENCES pay_schedules(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocation_type TEXT NOT NULL CHECK (allocation_type IN ('fixed','percentage')),
  fixed_amount NUMERIC(12,2),
  percentage NUMERIC(5,2),
  sort_order INT DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (allocation_type = 'fixed' AND fixed_amount IS NOT NULL) OR
    (allocation_type = 'percentage' AND percentage IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paycheck_id UUID REFERENCES paychecks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id),
  allocated_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (paycheck_id, category_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id),
  paycheck_id UUID REFERENCES paychecks(id),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  merchant TEXT,
  txn_date DATE NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','csv_import','plaid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_paycheck ON transactions(paycheck_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Deleting a paycheck shouldn't be blocked by (or destroy) transactions that
-- already happened against it — just detach them.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_paycheck_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_paycheck_id_fkey
  FOREIGN KEY (paycheck_id) REFERENCES paychecks(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  issuer TEXT,
  last_four TEXT,
  autopay_enabled BOOLEAN DEFAULT false,
  autopay_type TEXT CHECK (autopay_type IN ('minimum','statement_balance','full_balance', NULL)),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  statement_balance NUMERIC(12,2) NOT NULL,
  minimum_payment NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  statement_date DATE,
  paid BOOLEAN DEFAULT false,
  paid_amount NUMERIC(12,2),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_statements_due_date ON card_statements(due_date) WHERE paid = false;

-- Manual-entry only in this build (no linked_accounts table yet — Plaid phase is out of scope).
-- Each row is a single editable account (checking or savings), not an
-- append-only balance log — editing an account updates its balance in place.
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking','savings')),
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  as_of TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','plaid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One-time migration from the old single-balance checking_balance table (if
-- it's still around) into a "Checking" account, then drop it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checking_balance')
     AND NOT EXISTS (SELECT 1 FROM accounts)
  THEN
    INSERT INTO accounts (user_id, name, type, balance, as_of)
    SELECT user_id, 'Checking', 'checking', balance, as_of
    FROM checking_balance
    ORDER BY as_of DESC
    LIMIT 1;
  END IF;
END $$;

DROP TABLE IF EXISTS checking_balance;

-- This app only ever talks to Postgres directly (via `pg`, as the bypassrls
-- `postgres` role) and never through Supabase's auto-generated PostgREST/anon
-- API, so RLS is enabled with zero policies: a hard default-deny for the
-- anon/authenticated roles that API would otherwise use, with no effect on
-- our own connection.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE paychecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
