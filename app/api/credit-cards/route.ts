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
  const { nickname, issuer, last_four, autopay_enabled, autopay_type } = await request.json();

  if (!nickname) {
    return NextResponse.json({ error: "nickname is required" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO credit_cards (user_id, nickname, issuer, last_four, autopay_enabled, autopay_type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, nickname, issuer ?? null, last_four ?? null, autopay_enabled ?? false, autopay_type ?? null]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
