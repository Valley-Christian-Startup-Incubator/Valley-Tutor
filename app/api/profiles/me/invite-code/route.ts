import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";

// 8 chars, no ambiguous O/0/I/1, easy to read aloud/type for a parent.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  }
  return code;
}

// Tutee-only: a persistent (until regenerated) code a parent types in to
// link their account to this student (see app/api/parent-links).
export async function GET(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from("users").select("role, invite_code").eq("email", email).maybeSingle();
  if (!user || user.role !== "tutee") {
    return NextResponse.json({ error: "Only tutees have an invite code." }, { status: 403 });
  }
  if (user.invite_code) {
    return NextResponse.json({ code: user.invite_code });
  }

  // Collision is astronomically unlikely at this scale, but a couple of
  // retries costs nothing if the unique constraint ever does fire.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase.from("users").update({ invite_code: code }).eq("email", email).select("invite_code").single();
    if (!error && data) return NextResponse.json({ code: data.invite_code });
  }
  return NextResponse.json({ error: "Could not generate an invite code." }, { status: 500 });
}

// Regenerate — invalidates the old code (anyone who hadn't used it yet
// needs the new one).
export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from("users").select("role").eq("email", email).maybeSingle();
  if (!user || user.role !== "tutee") {
    return NextResponse.json({ error: "Only tutees have an invite code." }, { status: 403 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase.from("users").update({ invite_code: code }).eq("email", email).select("invite_code").single();
    if (!error && data) return NextResponse.json({ code: data.invite_code });
  }
  return NextResponse.json({ error: "Could not generate an invite code." }, { status: 500 });
}
