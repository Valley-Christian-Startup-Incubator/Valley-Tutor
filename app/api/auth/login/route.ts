import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPassword, issueAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "That email and password don't match an account here." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, password_hash, disabled")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "That email and password don't match an account here." }, { status: 401 });
  }
  if (user.disabled) {
    return NextResponse.json({ error: "This account has been disabled. Contact your program coordinator." }, { status: 403 });
  }

  const token = await issueAuthToken(user.email);
  return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
