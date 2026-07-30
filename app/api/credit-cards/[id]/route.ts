import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { nickname, issuer, last_four, autopay_enabled, autopay_type, archived } = await request.json();

  const result = await query(
    `UPDATE credit_cards SET
       nickname = COALESCE($3, nickname),
       issuer = COALESCE($4, issuer),
       last_four = COALESCE($5, last_four),
       autopay_enabled = COALESCE($6, autopay_enabled),
       autopay_type = COALESCE($7, autopay_type),
       archived = COALESCE($8, archived)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, nickname ?? null, issuer ?? null, last_four ?? null, autopay_enabled ?? null, autopay_type ?? null, archived ?? null]
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
