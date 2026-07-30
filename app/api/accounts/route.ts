import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET() {
  const userId = await requireUserId();
  const result = await query(
    `SELECT * FROM accounts WHERE user_id = $1 ORDER BY type, created_at`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { name, type, balance } = await request.json();

  if (!name || !type || balance == null) {
    return NextResponse.json({ error: "name, type, and balance are required" }, { status: 400 });
  }
  if (type !== "checking" && type !== "savings") {
    return NextResponse.json({ error: "type must be 'checking' or 'savings'" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO accounts (user_id, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, name, type, balance]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
