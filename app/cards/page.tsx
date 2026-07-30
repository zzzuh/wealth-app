import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import CardForm from "./CardForm";
import StatementForm from "./StatementForm";
import MarkPaidButton from "./MarkPaidButton";

interface Card {
  id: string;
  nickname: string;
  issuer: string | null;
  last_four: string | null;
  autopay_enabled: boolean;
  autopay_type: string | null;
}

interface Statement {
  id: string;
  card_id: string;
  card_nickname: string;
  statement_balance: string;
  minimum_payment: string;
  due_date: string;
  paid: boolean;
}

export default async function CardsPage() {
  const userId = await requireUserId();

  const cardsResult = await query<Card>(
    `SELECT * FROM credit_cards WHERE user_id = $1 AND archived = false ORDER BY created_at`,
    [userId]
  );

  const statementsResult = await query<Statement>(
    `SELECT s.*, c.nickname AS card_nickname
     FROM card_statements s
     JOIN credit_cards c ON c.id = s.card_id
     WHERE c.user_id = $1
     ORDER BY s.paid, s.due_date`,
    [userId]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Credit cards</h1>
        <p className="text-sm text-slate-500">Track statements and what you owe by when.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Cards</h2>
        <div className="rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Nickname</th>
                <th className="px-4 py-2 font-medium">Issuer</th>
                <th className="px-4 py-2 font-medium">Last 4</th>
                <th className="px-4 py-2 font-medium">Autopay</th>
              </tr>
            </thead>
            <tbody>
              {cardsResult.rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{c.nickname}</td>
                  <td className="px-4 py-2 text-slate-500">{c.issuer ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{c.last_four ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {c.autopay_enabled ? c.autopay_type ?? "on" : "off"}
                  </td>
                </tr>
              ))}
              {cardsResult.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No cards yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CardForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Statements</h2>
        <div className="rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Card</th>
                <th className="px-4 py-2 font-medium">Due date</th>
                <th className="px-4 py-2 font-medium">Statement balance</th>
                <th className="px-4 py-2 font-medium">Minimum</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {statementsResult.rows.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{s.card_nickname}</td>
                  <td className="px-4 py-2 text-slate-500">{formatDate(s.due_date)}</td>
                  <td className="px-4 py-2 text-slate-900">{formatCurrency(s.statement_balance)}</td>
                  <td className="px-4 py-2 text-slate-500">{formatCurrency(s.minimum_payment)}</td>
                  <td className="px-4 py-2">
                    {s.paid ? (
                      <span className="text-emerald-600">Paid</span>
                    ) : (
                      <span className="text-amber-600">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!s.paid && <MarkPaidButton id={s.id} />}
                  </td>
                </tr>
              ))}
              {statementsResult.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No statements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StatementForm cards={cardsResult.rows} />
      </section>
    </div>
  );
}
