import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Always returns success regardless of whether the email matches an
// account — otherwise this endpoint would let anyone probe which school
// emails have signed up.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Enter your school email." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from("users").select("email").eq("email", email).maybeSingle();

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await supabase.from("password_reset_tokens").insert({
      token,
      user_email: email,
      expires_at: new Date(Date.now() + RESET_TTL_MS).toISOString(),
    });

    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}`;
    sendEmail({
      to: [email],
      subject: "Reset your Valley Tutor password",
      html: `<p>Someone requested a password reset for this Valley Tutor account.</p>
        <p><a href="${resetLink}">Click here to set a new password</a>. This link expires in 1 hour.</p>
        <p>If you didn't request this, you can ignore this email.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
