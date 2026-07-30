import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

interface StatementRow {
  id: string;
  due_date: string;
  statement_balance: string;
  minimum_payment: string;
  card_nickname: string;
  autopay_enabled: boolean;
  autopay_type: string | null;
}

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  const targetDate = request.nextUrl.searchParams.get("date");

  if (!targetDate) {
    return NextResponse.json({ error: "date query param is required (YYYY-MM-DD)" }, { status: 400 });
  }

  const statementsResult = await query<StatementRow>(
    `SELECT s.id, s.due_date, s.statement_balance, s.minimum_payment,
            c.nickname AS card_nickname, c.autopay_enabled, c.autopay_type
     FROM card_statements s
     JOIN credit_cards c ON c.id = s.card_id
     WHERE c.user_id = $1 AND c.archived = false AND s.paid = false AND s.due_date <= $2
     ORDER BY s.due_date`,
    [userId, targetDate]
  );

  const breakdown = statementsResult.rows.map((s) => {
    const amountDue =
      s.autopay_enabled && s.autopay_type === "minimum"
        ? Number(s.minimum_payment)
        : Number(s.statement_balance);
    return {
      statement_id: s.id,
      card_nickname: s.card_nickname,
      due_date: s.due_date,
      amount_due: amountDue,
    };
  });

  const cashNeeded = breakdown.reduce((sum, item) => sum + item.amount_due, 0);

  const balanceResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(balance), 0) AS total FROM accounts WHERE user_id = $1 AND type = 'checking'`,
    [userId]
  );
  const currentBalance = Number(balanceResult.rows[0].total);

  return NextResponse.json({
    target_date: targetDate,
    cash_needed: cashNeeded,
    current_balance: currentBalance,
    surplus: currentBalance == null ? null : currentBalance - cashNeeded,
    breakdown,
  });
}
