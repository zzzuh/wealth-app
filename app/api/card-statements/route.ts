import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  const cardId = request.nextUrl.searchParams.get("card_id");

  const result = await query(
    `SELECT s.*, c.nickname AS card_nickname
     FROM card_statements s
     JOIN credit_cards c ON c.id = s.card_id
     WHERE c.user_id = $1 AND c.archived = false ${cardId ? "AND s.card_id = $2" : ""}
     ORDER BY s.due_date DESC`,
    cardId ? [userId, cardId] : [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { card_id, statement_balance, minimum_payment, due_date, statement_date } = await request.json();

  if (!card_id || statement_balance == null || minimum_payment == null || !due_date) {
    return NextResponse.json(
      { error: "card_id, statement_balance, minimum_payment, and due_date are required" },
      { status: 400 }
    );
  }

  const cardCheck = await query(`SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2`, [card_id, userId]);
  if (cardCheck.rows.length === 0) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const result = await query(
    `INSERT INTO card_statements (card_id, statement_balance, minimum_payment, due_date, statement_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [card_id, statement_balance, minimum_payment, due_date, statement_date ?? null]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
