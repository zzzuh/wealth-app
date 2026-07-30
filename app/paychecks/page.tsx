import Link from "next/link";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Paychecks</h1>
        <p className="text-sm text-slate-500">
          Each paycheck snapshots your budget categories into allocations at that moment.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Pay schedule</h2>
        <div className="rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Frequency</th>
                <th className="px-4 py-2 font-medium">Net amount</th>
                <th className="px-4 py-2 font-medium">Next pay date</th>
                <th className="px-4 py-2 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {schedulesResult.rows.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 capitalize text-slate-900">{s.frequency}</td>
                  <td className="px-4 py-2 text-slate-900">{formatCurrency(s.net_amount)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(s.next_pay_date)}</td>
                  <td className="px-4 py-2 text-slate-500">{s.active ? "Yes" : "No"}</td>
                </tr>
              ))}
              {schedulesResult.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No pay schedule set yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PayScheduleForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Paycheck history</h2>
        <div className="rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Pay date</th>
                <th className="px-4 py-2 font-medium">Net amount</th>
                <th className="px-4 py-2 font-medium">Allocated</th>
                <th className="px-4 py-2 font-medium">Spent</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {paychecksResult.rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{formatDate(p.pay_date)}</td>
                  <td className="px-4 py-2 text-slate-900">{formatCurrency(p.net_amount)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatCurrency(p.total_allocated)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatCurrency(p.total_spent)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/paychecks/${p.id}`} className="text-sm text-slate-600 hover:text-slate-900 underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {paychecksResult.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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
