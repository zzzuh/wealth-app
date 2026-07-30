import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import { link, pageTitle, tableWrap, th, td, tdMuted, tr, emptyRow, amountTone } from "@/lib/ui";

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
    <div className="space-y-8">
      <div>
        <Link href="/paychecks" className={link}>
          &larr; Back to paychecks
        </Link>
        <h1 className={`mt-2 ${pageTitle}`}>{formatDate(paycheck.pay_date)}</h1>
        <p className="mt-1 text-sm text-slate-400">Net amount: {formatCurrency(paycheck.net_amount)}</p>
      </div>

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
            {allocationsResult.rows.map((a) => {
              const safeToSpend = Number(a.allocated_amount) - Number(a.spent);
              return (
                <tr key={a.id} className={tr}>
                  <td className={td}>{a.category_name}</td>
                  <td className={tdMuted}>{formatCurrency(a.allocated_amount)}</td>
                  <td className={tdMuted}>{formatCurrency(a.spent)}</td>
                  <td className={`px-4 py-3 text-sm font-medium tabular-nums ${amountTone(safeToSpend)}`}>
                    {formatCurrency(safeToSpend)}
                  </td>
                </tr>
              );
            })}
            {allocationsResult.rows.length === 0 && (
              <tr>
                <td colSpan={4} className={emptyRow}>
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
