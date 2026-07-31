import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { paid, paid_amount, paid_date } = await request.json();

  // Un-marking a statement has to clear the payment details too, otherwise an
  // unpaid row keeps a stale paid_date/paid_amount. Note the explicit casts:
  // `paid: false` must reach the query as false, not be COALESCE'd away.
  const result = await query(
    `UPDATE card_statements s SET
       paid = COALESCE($3::boolean, s.paid),
       paid_amount = CASE WHEN $3::boolean IS FALSE THEN NULL
                          ELSE COALESCE($4::numeric, s.paid_amount) END,
       paid_date = CASE WHEN $3::boolean IS FALSE THEN NULL
                        ELSE COALESCE($5::date, s.paid_date) END
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
