import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await requireUserId();
  const result = await query(
    `SELECT * FROM checking_balance WHERE user_id = $1 ORDER BY as_of DESC LIMIT 1`,
    [userId]
  );
  return NextResponse.json(result.rows[0] ?? null);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { balance } = await request.json();

  if (balance == null) {
    return NextResponse.json({ error: "balance is required" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO checking_balance (user_id, balance, source) VALUES ($1, $2, 'manual') RETURNING *`,
    [userId, balance]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
