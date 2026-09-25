import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { sessionRowToJson } from "@/lib/sessions";
import { namesForEmails } from "@/lib/chats";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase.from("tutoring_sessions").select("*").eq("id", id).maybeSingle();
  if (!session || session.tutor_email !== email) {
    return NextResponse.json({ error: "Only the tutor on this session can accept it." }, { status: 403 });
  }
  if (session.status !== "proposed") {
    return NextResponse.json({ error: "This session isn't awaiting acceptance." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .update({ status: "accepted" })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Session accept failed", error);
    return NextResponse.json({ error: "Could not accept the session." }, { status: 500 });
  }
  const names = await namesForEmails([data.tutor_email, data.tutee_email]);
  return NextResponse.json(sessionRowToJson(data, names));
}
