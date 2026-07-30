import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await requireUserId();
  const result = await query(
    `SELECT * FROM pay_schedules WHERE user_id = $1 ORDER BY active DESC, created_at DESC`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { frequency, net_amount, next_pay_date } = await request.json();

  if (!frequency || net_amount == null || !next_pay_date) {
    return NextResponse.json(
      { error: "frequency, net_amount, and next_pay_date are required" },
      { status: 400 }
    );
  }

  const result = await query(
    `INSERT INTO pay_schedules (user_id, frequency, net_amount, next_pay_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, frequency, net_amount, next_pay_date]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
