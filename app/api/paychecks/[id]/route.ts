import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;

  const paycheckResult = await query(
    `SELECT * FROM paychecks WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (paycheckResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allocationsResult = await query(
    `SELECT
       ba.id,
       ba.category_id,
       bc.name AS category_name,
       ba.allocated_amount,
       COALESCE((
         SELECT SUM(t.amount) FROM transactions t
         WHERE t.paycheck_id = ba.paycheck_id AND t.category_id = ba.category_id
       ), 0) AS spent
     FROM budget_allocations ba
     JOIN budget_categories bc ON bc.id = ba.category_id
     WHERE ba.paycheck_id = $1
     ORDER BY bc.sort_order, bc.name`,
    [id]
  );

  return NextResponse.json({ ...paycheckResult.rows[0], allocations: allocationsResult.rows });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { pay_date, net_amount } = await request.json();

  const result = await query(
    `UPDATE paychecks SET
       pay_date = COALESCE($3, pay_date),
       net_amount = COALESCE($4, net_amount)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, pay_date ?? null, net_amount ?? null]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(`DELETE FROM paychecks WHERE id = $1 AND user_id = $2`, [id, userId]);
  return NextResponse.json({ ok: true });
}
