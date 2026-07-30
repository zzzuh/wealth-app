import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const { name, type, balance } = await request.json();

  if (type != null && type !== "checking" && type !== "savings") {
    return NextResponse.json({ error: "type must be 'checking' or 'savings'" }, { status: 400 });
  }

  const result = await query(
    `UPDATE accounts SET
       name = COALESCE($3, name),
       type = COALESCE($4, type),
       balance = COALESCE($5, balance),
       as_of = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, name ?? null, type ?? null, balance ?? null]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(`DELETE FROM accounts WHERE id = $1 AND user_id = $2`, [id, userId]);
  return NextResponse.json({ ok: true });
}
