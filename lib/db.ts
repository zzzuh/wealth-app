import { Pool, types, type QueryResultRow } from "pg";

// This app treats DATE columns (pay_date, due_date, txn_date, etc.) as plain
// calendar dates with no time-of-day or timezone meaning. Left at its default,
// `pg` parses them into JS Date objects at local midnight, which both breaks
// string methods callers expect (e.g. `.slice(0, 10)`) and can shift the
// displayed day depending on the server's timezone. Keep them as the raw
// "YYYY-MM-DD" strings Postgres sends instead.
types.setTypeParser(types.builtins.DATE, (value: string) => value);

declare global {
  var __pgPool: Pool | undefined;
}

export const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params as never[]);
}
