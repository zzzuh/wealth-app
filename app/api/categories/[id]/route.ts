import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const body = await request.json();
  const { name, allocation_type, fixed_amount, percentage, sort_order, archived } = body;

  const result = await query(
    `UPDATE budget_categories SET
       name = COALESCE($3, name),
       allocation_type = COALESCE($4, allocation_type),
       fixed_amount = COALESCE($5, fixed_amount),
       percentage = COALESCE($6, percentage),
       sort_order = COALESCE($7, sort_order),
       archived = COALESCE($8, archived)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, name ?? null, allocation_type ?? null, fixed_amount ?? null, percentage ?? null, sort_order ?? null, archived ?? null]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(
    `UPDATE budget_categories SET archived = true WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return NextResponse.json({ ok: true });
}
