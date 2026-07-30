import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import { pageTitle, pageSubtitle, tableWrap, th, td, tdMuted, tr, emptyRow } from "@/lib/ui";
import TransactionForm from "./TransactionForm";
import DeleteTransactionButton from "./DeleteTransactionButton";

interface Category {
  id: string;
  name: string;
}

interface Paycheck {
  id: string;
  pay_date: string;
}

interface Transaction {
  id: string;
  amount: string;
  description: string | null;
  merchant: string | null;
  txn_date: string;
  category_name: string;
}

export default async function TransactionsPage() {
  const userId = await requireUserId();

  const categoriesResult = await query<Category>(
    `SELECT id, name FROM budget_categories WHERE user_id = $1 AND archived = false ORDER BY sort_order, name`,
    [userId]
  );

  const paychecksResult = await query<Paycheck>(
    `SELECT id, pay_date FROM paychecks WHERE user_id = $1 ORDER BY pay_date DESC LIMIT 12`,
    [userId]
  );

  const transactionsResult = await query<Transaction>(
    `SELECT t.*, bc.name AS category_name
     FROM transactions t
     LEFT JOIN budget_categories bc ON bc.id = t.category_id
     WHERE t.user_id = $1
     ORDER BY t.txn_date DESC, t.created_at DESC
     LIMIT 100`,
    [userId]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Transactions</h1>
        <p className={pageSubtitle}>Manual spend entries, tied to a category and pay period.</p>
      </div>

      <TransactionForm categories={categoriesResult.rows} paychecks={paychecksResult.rows} />

      <div className={tableWrap}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Category</th>
              <th className={th}>Merchant</th>
              <th className={th}>Description</th>
              <th className={th}>Amount</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {transactionsResult.rows.map((t) => (
              <tr key={t.id} className={tr}>
                <td className={tdMuted}>{formatDate(t.txn_date)}</td>
                <td className={td}>{t.category_name}</td>
                <td className={tdMuted}>{t.merchant ?? "—"}</td>
                <td className={tdMuted}>{t.description ?? "—"}</td>
                <td className={td}>{formatCurrency(t.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteTransactionButton id={t.id} />
                </td>
              </tr>
            ))}
            {transactionsResult.rows.length === 0 && (
              <tr>
                <td colSpan={6} className={emptyRow}>
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
