import Link from "next/link";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  pageTitle,
  link,
  sectionLabel,
  statCard,
  statValue,
  tableWrap,
  th,
  td,
  tdMuted,
  tr,
  emptyRow,
  amountTone,
} from "@/lib/ui";
import CashNeededWidget from "./components/CashNeededWidget";
import AccountForm from "./components/AccountForm";
import EditAccountButton from "./components/EditAccountButton";
import DeleteAccountButton from "./components/DeleteAccountButton";

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

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings";
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

  const accountsResult = await query<Account>(
    `SELECT * FROM accounts WHERE user_id = $1 ORDER BY type, created_at`,
    [userId]
  );
  const accounts = accountsResult.rows;
  const totalChecking = accounts
    .filter((a) => a.type === "checking")
    .reduce((sum, a) => sum + Number(a.balance), 0);
  const totalSavings = accounts
    .filter((a) => a.type === "savings")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 30);

  return (
    <div className="space-y-12">
      <h1 className={pageTitle}>Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className={statCard}>
          <h2 className={sectionLabel}>Checking</h2>
          <p className={statValue}>{formatCurrency(totalChecking)}</p>
        </div>

        <div className={statCard}>
          <h2 className={sectionLabel}>Savings</h2>
          <p className={statValue}>{formatCurrency(totalSavings)}</p>
        </div>

        <CashNeededWidget
          defaultDate={defaultTargetDate.toISOString().slice(0, 10)}
          checkingBalance={totalChecking}
        />
      </section>

      <section className="space-y-4">
        <h2 className={sectionLabel}>Accounts</h2>
        <div className={tableWrap}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Type</th>
                <th className={th}>Balance</th>
                <th className={th}>As of</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className={tr}>
                  <td className={td}>{a.name}</td>
                  <td className={`${tdMuted} capitalize`}>{a.type}</td>
                  <td className={td}>{formatCurrency(a.balance)}</td>
                  <td className={tdMuted}>{formatDate(a.as_of)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-4">
                      <EditAccountButton account={a} />
                      <DeleteAccountButton id={a.id} name={a.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className={emptyRow}>
                    No accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AccountForm />
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
