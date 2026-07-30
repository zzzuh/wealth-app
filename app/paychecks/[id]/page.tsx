import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";

interface Paycheck {
  id: string;
  pay_date: string;
  net_amount: string;
}

interface Allocation {
  id: string;
  category_id: string;
  category_name: string;
  allocated_amount: string;
  spent: string;
}

export default async function PaycheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  const paycheckResult = await query<Paycheck>(
    `SELECT * FROM paychecks WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  const paycheck = paycheckResult.rows[0];
  if (!paycheck) notFound();

  const allocationsResult = await query<Allocation>(
    `SELECT
       ba.id, ba.category_id, bc.name AS category_name, ba.allocated_amount,
       COALESCE((
         SELECT SUM(t.amount) FROM transactions t
         WHERE t.paycheck_id = ba.paycheck_id AND t.category_id = ba.category_id
       ), 0) AS spent
     FROM budget_allocations ba
     JOIN budget_categories bc ON bc.id = ba.category_id
     WHERE ba.paycheck_id = $1
     ORDER BY bc.sort_order, bc.name`,
    [id]
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/paychecks" className="text-sm text-slate-500 hover:text-slate-900">
          &larr; Back to paychecks
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{formatDate(paycheck.pay_date)}</h1>
        <p className="text-sm text-slate-500">Net amount: {formatCurrency(paycheck.net_amount)}</p>
      </div>

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
            {allocationsResult.rows.map((a) => {
              const safeToSpend = Number(a.allocated_amount) - Number(a.spent);
              return (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{a.category_name}</td>
                  <td className="px-4 py-2 text-slate-500">{formatCurrency(a.allocated_amount)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatCurrency(a.spent)}</td>
                  <td className={`px-4 py-2 font-medium ${safeToSpend < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatCurrency(safeToSpend)}
                  </td>
                </tr>
              );
            })}
            {allocationsResult.rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No allocations for this paycheck.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
