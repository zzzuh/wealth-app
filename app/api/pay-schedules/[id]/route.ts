import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { frequency, net_amount, next_pay_date, active } = await request.json();

  const result = await query(
    `UPDATE pay_schedules SET
       frequency = COALESCE($3, frequency),
       net_amount = COALESCE($4, net_amount),
       next_pay_date = COALESCE($5, next_pay_date),
       active = COALESCE($6, active)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, frequency ?? null, net_amount ?? null, next_pay_date ?? null, active ?? null]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(`DELETE FROM pay_schedules WHERE id = $1 AND user_id = $2`, [id, userId]);
  return NextResponse.json({ ok: true });
}
