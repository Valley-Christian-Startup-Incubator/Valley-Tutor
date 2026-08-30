import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { sessionRowToJson } from "@/lib/sessions";
import { namesForEmails } from "@/lib/chats";

export async function GET(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select("*")
    .or(`tutor_email.eq.${email},tutee_email.eq.${email}`)
    .order("datetime", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not load sessions." }, { status: 500 });
  const names = await namesForEmails((data || []).flatMap((s) => [s.tutor_email, s.tutee_email]));
  return NextResponse.json((data || []).map((row) => sessionRowToJson(row, names)));
}

// Sessions are no longer created directly here — a tutee books a slot via
// POST /api/chats/[chatId]/session-proposals (status: 'proposed'), and the
// tutor accepts via POST /api/sessions/[id]/accept. See lib/sessions.ts.
