import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await requireUserId();
  const result = await query(
    `SELECT c.*,
       (
         SELECT row_to_json(s) FROM (
           SELECT * FROM card_statements
           WHERE card_id = c.id
           ORDER BY due_date DESC
           LIMIT 1
         ) s
       ) AS latest_statement
     FROM credit_cards c
     WHERE c.user_id = $1 AND c.archived = false
     ORDER BY c.created_at`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { nickname, issuer, last_four, autopay_enabled, autopay_type, due_day } = await request.json();

  if (!nickname) {
    return NextResponse.json({ error: "nickname is required" }, { status: 400 });
  }

  const dueDay = due_day == null || due_day === "" ? null : Number(due_day);
  if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
    return NextResponse.json({ error: "due_day must be a whole number between 1 and 31" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO credit_cards (user_id, nickname, issuer, last_four, autopay_enabled, autopay_type, due_day)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, nickname, issuer ?? null, last_four ?? null, autopay_enabled ?? false, autopay_type ?? null, dueDay]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
