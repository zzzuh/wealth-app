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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(`DELETE FROM paychecks WHERE id = $1 AND user_id = $2`, [id, userId]);
  return NextResponse.json({ ok: true });
}
