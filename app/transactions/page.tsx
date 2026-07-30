import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
        <p className="text-sm text-slate-500">Manual spend entries, tied to a category and pay period.</p>
      </div>

      <TransactionForm categories={categoriesResult.rows} paychecks={paychecksResult.rows} />

      <div className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Merchant</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {transactionsResult.rows.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-500">{formatDate(t.txn_date)}</td>
                <td className="px-4 py-2 text-slate-900">{t.category_name}</td>
                <td className="px-4 py-2 text-slate-500">{t.merchant ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{t.description ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{formatCurrency(t.amount)}</td>
                <td className="px-4 py-2 text-right">
                  <DeleteTransactionButton id={t.id} />
                </td>
              </tr>
            ))}
            {transactionsResult.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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
