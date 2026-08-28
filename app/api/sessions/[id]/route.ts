import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { sessionRowToJson } from "@/lib/sessions";
import { namesForEmails } from "@/lib/chats";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase.from("tutoring_sessions").select("*").eq("id", id).maybeSingle();
  if (!session || (session.tutor_email !== email && session.tutee_email !== email)) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const names = await namesForEmails([session.tutor_email, session.tutee_email]);
  return NextResponse.json(sessionRowToJson(session, names));
}
