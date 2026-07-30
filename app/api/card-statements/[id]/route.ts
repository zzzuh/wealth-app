import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { paid, paid_amount, paid_date } = await request.json();

  const result = await query(
    `UPDATE card_statements s SET
       paid = COALESCE($3, s.paid),
       paid_amount = COALESCE($4, s.paid_amount),
       paid_date = COALESCE($5, s.paid_date)
     FROM credit_cards c
     WHERE s.id = $1 AND s.card_id = c.id AND c.user_id = $2
     RETURNING s.*`,
    [id, userId, paid ?? null, paid_amount ?? null, paid_date ?? null]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}
