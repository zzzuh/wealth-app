import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();
  const paycheckId = request.nextUrl.searchParams.get("paycheck_id");

  const result = await query(
    `SELECT t.*, bc.name AS category_name
     FROM transactions t
     LEFT JOIN budget_categories bc ON bc.id = t.category_id
     WHERE t.user_id = $1 ${paycheckId ? "AND t.paycheck_id = $2" : ""}
     ORDER BY t.txn_date DESC, t.created_at DESC`,
    paycheckId ? [userId, paycheckId] : [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { category_id, paycheck_id, amount, description, merchant, txn_date } = await request.json();

  if (!category_id || amount == null || !txn_date) {
    return NextResponse.json(
      { error: "category_id, amount, and txn_date are required" },
      { status: 400 }
    );
  }

  const result = await query(
    `INSERT INTO transactions (user_id, category_id, paycheck_id, amount, description, merchant, txn_date, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')
     RETURNING *`,
    [userId, category_id, paycheck_id ?? null, amount, description ?? null, merchant ?? null, txn_date]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
