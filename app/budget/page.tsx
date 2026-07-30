import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";
import { pageTitle, pageSubtitle, tableWrap, th, td, tdMuted, tr, emptyRow } from "@/lib/ui";
import { frequencyLabel, prorateForPaycheck } from "@/lib/frequency";
import CategoryForm from "./CategoryForm";
import EditCategoryButton from "./EditCategoryButton";
import DeleteCategoryButton from "./DeleteCategoryButton";

interface Category {
  id: string;
  name: string;
  allocation_type: "fixed" | "percentage";
  fixed_amount: string | null;
  percentage: string | null;
  frequency: string | null;
}

export default async function BudgetPage() {
  const userId = await requireUserId();
  const result = await query<Category>(
    `SELECT * FROM budget_categories WHERE user_id = $1 AND archived = false ORDER BY sort_order, name`,
    [userId]
  );

  const scheduleResult = await query<{ frequency: string }>(
    `SELECT frequency FROM pay_schedules WHERE user_id = $1 ORDER BY active DESC, created_at DESC LIMIT 1`,
    [userId]
  );
  const payScheduleFrequency = scheduleResult.rows[0]?.frequency ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Budget categories</h1>
        <p className={pageSubtitle}>
          Define fixed dollar or percentage allocations. These are snapshotted onto each paycheck.
          {payScheduleFrequency && (
            <> Fixed expenses with a frequency are prorated against your {payScheduleFrequency} pay schedule.</>
          )}
        </p>
      </div>

      <div className={tableWrap}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Type</th>
              <th className={th}>Amount</th>
              <th className={th}>Frequency</th>
              <th className={th}>Per paycheck</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {result.rows.map((c) => {
              const perPaycheck =
                c.allocation_type === "fixed"
                  ? prorateForPaycheck(Number(c.fixed_amount), c.frequency, payScheduleFrequency)
                  : null;
              return (
                <tr key={c.id} className={tr}>
                  <td className={td}>{c.name}</td>
                  <td className={`${tdMuted} capitalize`}>{c.allocation_type}</td>
                  <td className={td}>
                    {c.allocation_type === "fixed" ? formatCurrency(c.fixed_amount ?? 0) : `${c.percentage}%`}
                  </td>
                  <td className={tdMuted}>{c.allocation_type === "fixed" ? frequencyLabel(c.frequency) : "—"}</td>
                  <td className={tdMuted}>{perPaycheck != null ? formatCurrency(perPaycheck) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-4">
                      <EditCategoryButton category={c} payScheduleFrequency={payScheduleFrequency} />
                      <DeleteCategoryButton id={c.id} name={c.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={6} className={emptyRow}>
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryForm payScheduleFrequency={payScheduleFrequency} />
    </div>
  );
}
