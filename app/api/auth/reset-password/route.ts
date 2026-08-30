import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!token || newPassword.length < 6) {
    return NextResponse.json({ error: "Enter a password with at least 6 characters." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: resetRow } = await supabase
    .from("password_reset_tokens")
    .select("user_email, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!resetRow || new Date(resetRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await supabase.from("users").update({ password_hash: passwordHash }).eq("email", resetRow.user_email);
  await supabase.from("password_reset_tokens").delete().eq("token", token);
  // Force re-login everywhere — a reset means the old password (and any
  // session it produced) should no longer be trusted.
  await supabase.from("auth_tokens").delete().eq("user_email", resetRow.user_email);

  return NextResponse.json({ ok: true });
}
