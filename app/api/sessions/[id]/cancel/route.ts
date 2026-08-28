import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { sessionRowToJson } from "@/lib/sessions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase.from("tutoring_sessions").select("*").eq("id", id).maybeSingle();
  if (!session || (session.tutor_email !== email && session.tutee_email !== email)) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .update({ status: "cancelled", cancelled_by: email, cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Session cancel failed", error);
    return NextResponse.json({ error: "Could not cancel the session." }, { status: 500 });
  }
  return NextResponse.json(sessionRowToJson(data));
}
