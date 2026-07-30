import { NextRequest, NextResponse } from "next/server";
import { query, pool } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";
import { prorateForPaycheck } from "@/lib/frequency";

interface CategoryRow {
  id: string;
  allocation_type: "fixed" | "percentage";
  fixed_amount: string | null;
  percentage: string | null;
  frequency: string | null;
}

export async function GET() {
  const userId = await requireUserId();
  const result = await query(
    `SELECT p.*,
       COALESCE(SUM(ba.allocated_amount), 0) AS total_allocated,
       COALESCE((
         SELECT SUM(t.amount) FROM transactions t WHERE t.paycheck_id = p.id
       ), 0) AS total_spent
     FROM paychecks p
     LEFT JOIN budget_allocations ba ON ba.paycheck_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.pay_date DESC`,
    [userId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { pay_schedule_id, pay_date, net_amount } = await request.json();

  if (!pay_date || net_amount == null) {
    return NextResponse.json({ error: "pay_date and net_amount are required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paycheckResult = await client.query(
      `INSERT INTO paychecks (user_id, pay_schedule_id, pay_date, net_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, pay_schedule_id ?? null, pay_date, net_amount]
    );
    const paycheck = paycheckResult.rows[0];

    const categoriesResult = await client.query<CategoryRow>(
      `SELECT id, allocation_type, fixed_amount, percentage, frequency
       FROM budget_categories
       WHERE user_id = $1 AND archived = false`,
      [userId]
    );

    let payScheduleFrequency: string | null = null;
    if (pay_schedule_id) {
      const scheduleResult = await client.query<{ frequency: string }>(
        `SELECT frequency FROM pay_schedules WHERE id = $1 AND user_id = $2`,
        [pay_schedule_id, userId]
      );
      payScheduleFrequency = scheduleResult.rows[0]?.frequency ?? null;
    }

    const allocations = [];
    for (const category of categoriesResult.rows) {
      const allocatedAmount =
        category.allocation_type === "fixed"
          ? prorateForPaycheck(Number(category.fixed_amount), category.frequency, payScheduleFrequency)
          : (Number(net_amount) * Number(category.percentage)) / 100;

      const allocationResult = await client.query(
        `INSERT INTO budget_allocations (paycheck_id, category_id, allocated_amount)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [paycheck.id, category.id, allocatedAmount.toFixed(2)]
      );
      allocations.push(allocationResult.rows[0]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ ...paycheck, allocations }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
