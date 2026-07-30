import Link from "next/link";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import { pageTitle, link, sectionLabel, tableWrap, th, td, tdMuted, tr, emptyRow, amountTone } from "@/lib/ui";
import CashNeededWidget from "./components/CashNeededWidget";
import CheckingBalanceForm from "./components/CheckingBalanceForm";

interface Paycheck {
  id: string;
  pay_date: string;
  net_amount: string;
}

interface Allocation {
  category_name: string;
  allocated_amount: string;
  spent: string;
}

interface CheckingBalance {
  balance: string;
  as_of: string;
}

export default async function DashboardPage() {
  const userId = await requireUserId();

  const paycheckResult = await query<Paycheck>(
    `SELECT * FROM paychecks WHERE user_id = $1 ORDER BY pay_date DESC LIMIT 1`,
    [userId]
  );
  const latestPaycheck = paycheckResult.rows[0];

  let allocations: Allocation[] = [];
  if (latestPaycheck) {
    const allocationsResult = await query<Allocation>(
      `SELECT bc.name AS category_name, ba.allocated_amount,
         COALESCE((
           SELECT SUM(t.amount) FROM transactions t
           WHERE t.paycheck_id = ba.paycheck_id AND t.category_id = ba.category_id
         ), 0) AS spent
       FROM budget_allocations ba
       JOIN budget_categories bc ON bc.id = ba.category_id
       WHERE ba.paycheck_id = $1
       ORDER BY bc.sort_order, bc.name`,
      [latestPaycheck.id]
    );
    allocations = allocationsResult.rows;
  }

  const balanceResult = await query<CheckingBalance>(
    `SELECT balance, as_of FROM checking_balance WHERE user_id = $1 ORDER BY as_of DESC LIMIT 1`,
    [userId]
  );
  const checkingBalance = balanceResult.rows[0] ?? null;

  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 30);

  return (
    <div className="space-y-12">
      <h1 className={pageTitle}>Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4 rounded-xl bg-slate-50 p-5">
          <h2 className={sectionLabel}>Checking balance</h2>
          {checkingBalance ? (
            <div>
              <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatCurrency(checkingBalance.balance)}
              </p>
              <p className="mt-1 text-xs text-slate-400">as of {formatDate(checkingBalance.as_of)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No balance entered yet.</p>
          )}
          <CheckingBalanceForm />
        </div>

        <CashNeededWidget
          defaultDate={defaultTargetDate.toISOString().slice(0, 10)}
          checkingBalance={checkingBalance ? Number(checkingBalance.balance) : null}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={sectionLabel}>
            Current paycheck {latestPaycheck && `— ${formatDate(latestPaycheck.pay_date)}`}
          </h2>
          <Link href="/paychecks" className={link}>
            View all
          </Link>
        </div>

        {latestPaycheck ? (
          <div className={tableWrap}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Category</th>
                  <th className={th}>Allocated</th>
                  <th className={th}>Spent</th>
                  <th className={th}>Safe to spend</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => {
                  const safeToSpend = Number(a.allocated_amount) - Number(a.spent);
                  return (
                    <tr key={a.category_name} className={tr}>
                      <td className={td}>{a.category_name}</td>
                      <td className={tdMuted}>{formatCurrency(a.allocated_amount)}</td>
                      <td className={tdMuted}>{formatCurrency(a.spent)}</td>
                      <td className={`px-4 py-3 text-sm font-medium tabular-nums ${amountTone(safeToSpend)}`}>
                        {formatCurrency(safeToSpend)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={emptyRow}>No paychecks recorded yet. Add one from the Paychecks page.</p>
        )}
      </section>
    </div>
  );
}
