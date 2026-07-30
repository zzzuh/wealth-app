import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Budget categories</h1>
        <p className="text-sm text-slate-500">
          Define fixed dollar or percentage allocations. These are snapshotted onto each paycheck.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {result.rows.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-900">{c.name}</td>
                <td className="px-4 py-2 text-slate-500 capitalize">{c.allocation_type}</td>
                <td className="px-4 py-2 text-slate-900">
                  {c.allocation_type === "fixed"
                    ? formatCurrency(c.fixed_amount ?? 0)
                    : `${c.percentage}%`}
                </td>
                <td className="px-4 py-2 text-right">
                  <ArchiveCategoryButton id={c.id} />
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
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
