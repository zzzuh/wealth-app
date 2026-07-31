import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { formatCurrency, formatDate } from "@/lib/format";
import { pageTitle, pageSubtitle, sectionLabel, tableWrap, th, td, tdMuted, tr, emptyRow, pill } from "@/lib/ui";
import AddCardButton from "./AddCardButton";
import AddStatementButton from "./AddStatementButton";
import TogglePaidButton from "./TogglePaidButton";
import EditCardButton from "./EditCardButton";
import DeleteCardButton from "./DeleteCardButton";

interface Card {
  id: string;
  nickname: string;
  issuer: string | null;
  last_four: string | null;
  due_day: number | null;
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
     WHERE c.user_id = $1 AND c.archived = false
     ORDER BY s.paid, s.due_date`,
    [userId]
  );

  return (
    <div className="space-y-12">
      <div>
        <h1 className={pageTitle}>Credit cards</h1>
        <p className={pageSubtitle}>Track statements and what you owe by when.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={sectionLabel}>Cards</h2>
          <AddCardButton />
        </div>
        <div className={tableWrap}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Nickname</th>
                <th className={th}>Issuer</th>
                <th className={th}>Last 4</th>
                <th className={th}>Due day</th>
                <th className={th}>Autopay</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {cardsResult.rows.map((c) => (
                <tr key={c.id} className={tr}>
                  <td className={td}>{c.nickname}</td>
                  <td className={tdMuted}>{c.issuer ?? "—"}</td>
                  <td className={tdMuted}>{c.last_four ?? "—"}</td>
                  <td className={tdMuted}>{c.due_day ?? "—"}</td>
                  <td className={tdMuted}>{c.autopay_enabled ? c.autopay_type ?? "on" : "off"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-4">
                      <EditCardButton card={c} />
                      <DeleteCardButton id={c.id} nickname={c.nickname} />
                    </div>
                  </td>
                </tr>
              ))}
              {cardsResult.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={emptyRow}>
                    No cards yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={sectionLabel}>Statements</h2>
          <AddStatementButton cards={cardsResult.rows} />
        </div>
        <div className={tableWrap}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Card</th>
                <th className={th}>Due date</th>
                <th className={th}>Statement balance</th>
                <th className={th}>Minimum</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {statementsResult.rows.map((s) => (
                <tr key={s.id} className={tr}>
                  <td className={td}>{s.card_nickname}</td>
                  <td className={tdMuted}>{formatDate(s.due_date)}</td>
                  <td className={td}>{formatCurrency(s.statement_balance)}</td>
                  <td className={tdMuted}>{formatCurrency(s.minimum_payment)}</td>
                  <td className="px-4 py-3">
                    <span className={pill(s.paid ? "emerald" : "amber")}>
                      {s.paid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TogglePaidButton id={s.id} paid={s.paid} />
                  </td>
                </tr>
              ))}
              {statementsResult.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={emptyRow}>
                    No statements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
