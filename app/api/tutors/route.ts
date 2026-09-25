import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { profileRowToJson } from "@/lib/profiles";

// Matching (tutee-only) needs to browse every tutor's profile, which is the
// whole point of the feature — tutors already consent to their info being
// shared with interested families per the signed participation agreement.
export async function GET(req: NextRequest) {
  const callerEmail = await resolveAuthToken(req);
  if (!callerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: tutors, error } = await supabase.from("users").select("id, name, email, role").eq("role", "tutor");
  if (error) return NextResponse.json({ error: "Could not load tutors." }, { status: 500 });
  if (!tutors || tutors.length === 0) return NextResponse.json([]);

  const emails = tutors.map((t) => t.email);
  const { data: profileRows, error: profileError } = await supabase.from("profiles").select("*").in("email", emails);
  if (profileError) return NextResponse.json({ error: "Could not load tutor profiles." }, { status: 500 });

  const profilesByEmail = new Map((profileRows || []).map((row) => [row.email, profileRowToJson(row)]));
  const combined = tutors.map((user) => ({ user, profile: profilesByEmail.get(user.email) }));

  return NextResponse.json(combined);
}
