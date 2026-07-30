import Link from "next/link";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
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
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Checking balance</h2>
          {checkingBalance ? (
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {formatCurrency(checkingBalance.balance)}
              </p>
              <p className="text-xs text-slate-400">as of {formatDate(checkingBalance.as_of)}</p>
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Current paycheck {latestPaycheck && `(${formatDate(latestPaycheck.pay_date)})`}
          </h2>
          <Link href="/paychecks" className="text-sm text-slate-500 hover:text-slate-900 underline">
            View all
          </Link>
        </div>

        {latestPaycheck ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Allocated</th>
                  <th className="px-4 py-2 font-medium">Spent</th>
                  <th className="px-4 py-2 font-medium">Safe to spend</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => {
                  const safeToSpend = Number(a.allocated_amount) - Number(a.spent);
                  return (
                    <tr key={a.category_name} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-900">{a.category_name}</td>
                      <td className="px-4 py-2 text-slate-500">{formatCurrency(a.allocated_amount)}</td>
                      <td className="px-4 py-2 text-slate-500">{formatCurrency(a.spent)}</td>
                      <td className={`px-4 py-2 font-medium ${safeToSpend < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatCurrency(safeToSpend)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
            No paychecks recorded yet. Add one from the Paychecks page.
          </p>
        )}
      </section>
    </div>
  );
}
