import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth";

interface UserRow {
  id: string;
  password_hash: string;
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const result = await query<UserRow>(
    "SELECT id, password_hash FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
