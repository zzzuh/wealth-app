import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUserId } from "@/lib/current-user";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  await query(`DELETE FROM transactions WHERE id = $1 AND user_id = $2`, [id, userId]);
  return NextResponse.json({ ok: true });
}
