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
  const { name, allocation_type, fixed_amount, percentage, frequency, sort_order } = body;

  if (!name || !allocation_type) {
    return NextResponse.json({ error: "name and allocation_type are required" }, { status: 400 });
  }
  if (allocation_type === "fixed" && fixed_amount == null) {
    return NextResponse.json({ error: "fixed_amount is required for fixed categories" }, { status: 400 });
  }
  if (allocation_type === "percentage" && percentage == null) {
    return NextResponse.json({ error: "percentage is required for percentage categories" }, { status: 400 });
  }
  const allowedFrequencies = ["weekly", "biweekly", "semimonthly", "monthly"];
  if (frequency != null && !allowedFrequencies.includes(frequency)) {
    return NextResponse.json({ error: "frequency must be one of " + allowedFrequencies.join(", ") }, { status: 400 });
  }

  // Frequency only applies to fixed-amount expenses — a percentage of a
  // paycheck already scales to that specific paycheck.
  const finalFrequency = allocation_type === "percentage" ? null : frequency ?? null;

  const result = await query(
    `INSERT INTO budget_categories (user_id, name, allocation_type, fixed_amount, percentage, frequency, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, name, allocation_type, fixed_amount ?? null, percentage ?? null, finalFrequency, sort_order ?? 0]
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
