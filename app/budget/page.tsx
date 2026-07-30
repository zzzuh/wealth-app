import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";
import { pageTitle, pageSubtitle, tableWrap, th, td, tdMuted, tr, emptyRow } from "@/lib/ui";
import CategoryForm from "./CategoryForm";
import ArchiveCategoryButton from "./ArchiveCategoryButton";

interface Category {
  id: string;
  name: string;
  allocation_type: "fixed" | "percentage";
  fixed_amount: string | null;
  percentage: string | null;
}

export default async function BudgetPage() {
  const userId = await requireUserId();
  const result = await query<Category>(
    `SELECT * FROM budget_categories WHERE user_id = $1 AND archived = false ORDER BY sort_order, name`,
    [userId]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Budget categories</h1>
        <p className={pageSubtitle}>
          Define fixed dollar or percentage allocations. These are snapshotted onto each paycheck.
        </p>
      </div>

      <div className={tableWrap}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Type</th>
              <th className={th}>Amount</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {result.rows.map((c) => (
              <tr key={c.id} className={tr}>
                <td className={td}>{c.name}</td>
                <td className={`${tdMuted} capitalize`}>{c.allocation_type}</td>
                <td className={td}>
                  {c.allocation_type === "fixed"
                    ? formatCurrency(c.fixed_amount ?? 0)
                    : `${c.percentage}%`}
                </td>
                <td className="px-4 py-3 text-right">
                  <ArchiveCategoryButton id={c.id} />
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={4} className={emptyRow}>
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryForm />
    </div>
  );
}
