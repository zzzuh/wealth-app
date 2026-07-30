import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await requireUserId();
  const result = await query(
    `SELECT * FROM budget_categories WHERE user_id = $1 AND archived = false ORDER BY sort_order, name`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const body = await request.json();
  const { name, allocation_type, fixed_amount, percentage, sort_order } = body;

  if (!name || !allocation_type) {
    return NextResponse.json({ error: "name and allocation_type are required" }, { status: 400 });
  }
  if (allocation_type === "fixed" && fixed_amount == null) {
    return NextResponse.json({ error: "fixed_amount is required for fixed categories" }, { status: 400 });
  }
  if (allocation_type === "percentage" && percentage == null) {
    return NextResponse.json({ error: "percentage is required for percentage categories" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO budget_categories (user_id, name, allocation_type, fixed_amount, percentage, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, allocation_type, fixed_amount ?? null, percentage ?? null, sort_order ?? 0]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
