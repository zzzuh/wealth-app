import Link from "next/link";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import { pageTitle, pageSubtitle, sectionLabel, tableWrap, th, td, tdMuted, tr, emptyRow, link } from "@/lib/ui";
import PaycheckForm from "./PaycheckForm";
import PayScheduleForm from "./PayScheduleForm";

interface PaySchedule {
  id: string;
  frequency: string;
  net_amount: string;
  next_pay_date: string;
  active: boolean;
}

interface Paycheck {
  id: string;
  pay_date: string;
  net_amount: string;
  total_allocated: string;
  total_spent: string;
}

export default async function PaychecksPage() {
  const userId = await requireUserId();

  const schedulesResult = await query<PaySchedule>(
    `SELECT * FROM pay_schedules WHERE user_id = $1 ORDER BY active DESC, created_at DESC`,
    [userId]
  );

  const paychecksResult = await query<Paycheck>(
    `SELECT p.*,
       COALESCE(SUM(ba.allocated_amount), 0) AS total_allocated,
       COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.paycheck_id = p.id), 0) AS total_spent
     FROM paychecks p
     LEFT JOIN budget_allocations ba ON ba.paycheck_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.pay_date DESC`,
    [userId]
  );

  return (
    <div className="space-y-12">
      <div>
        <h1 className={pageTitle}>Paychecks</h1>
        <p className={pageSubtitle}>
          Each paycheck snapshots your budget categories into allocations at that moment.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className={sectionLabel}>Pay schedule</h2>
        <div className={tableWrap}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Frequency</th>
                <th className={th}>Net amount</th>
                <th className={th}>Next pay date</th>
                <th className={th}>Active</th>
              </tr>
            </thead>
            <tbody>
              {schedulesResult.rows.map((s) => (
                <tr key={s.id} className={tr}>
                  <td className={`${td} capitalize`}>{s.frequency}</td>
                  <td className={td}>{formatCurrency(s.net_amount)}</td>
                  <td className={tdMuted}>{formatDate(s.next_pay_date)}</td>
                  <td className={tdMuted}>{s.active ? "Yes" : "No"}</td>
                </tr>
              ))}
              {schedulesResult.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className={emptyRow}>
                    No pay schedule set yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PayScheduleForm />
      </section>

      <section className="space-y-4">
        <h2 className={sectionLabel}>Paycheck history</h2>
        <div className={tableWrap}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Pay date</th>
                <th className={th}>Net amount</th>
                <th className={th}>Allocated</th>
                <th className={th}>Spent</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {paychecksResult.rows.map((p) => (
                <tr key={p.id} className={tr}>
                  <td className={td}>{formatDate(p.pay_date)}</td>
                  <td className={td}>{formatCurrency(p.net_amount)}</td>
                  <td className={tdMuted}>{formatCurrency(p.total_allocated)}</td>
                  <td className={tdMuted}>{formatCurrency(p.total_spent)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/paychecks/${p.id}`} className={link}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {paychecksResult.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className={emptyRow}>
                    No paychecks recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaycheckForm paySchedules={schedulesResult.rows} />
      </section>
    </div>
  );
}
