import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const body = await request.json();
  const { nickname, issuer, last_four, autopay_enabled, autopay_type, archived } = body;

  // Unlike the other fields, due_day is clearable: sending an explicit null
  // wipes it, while omitting the key leaves it alone.
  const touchesDueDay = "due_day" in body;
  const dueDay = body.due_day == null || body.due_day === "" ? null : Number(body.due_day);
  if (touchesDueDay && dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
    return NextResponse.json({ error: "due_day must be a whole number between 1 and 31" }, { status: 400 });
  }

  const result = await query(
    `UPDATE credit_cards SET
       nickname = COALESCE($3, nickname),
       issuer = COALESCE($4, issuer),
       last_four = COALESCE($5, last_four),
       autopay_enabled = COALESCE($6, autopay_enabled),
       autopay_type = COALESCE($7, autopay_type),
       archived = COALESCE($8, archived),
       due_day = CASE WHEN $9::boolean THEN $10::int ELSE due_day END
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, nickname ?? null, issuer ?? null, last_four ?? null, autopay_enabled ?? null, autopay_type ?? null, archived ?? null, touchesDueDay, dueDay]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(`UPDATE credit_cards SET archived = true WHERE id = $1 AND user_id = $2`, [id, userId]);
  return NextResponse.json({ ok: true });
}
