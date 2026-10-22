import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { isLinkedParentOf, namesForEmails } from "@/lib/chats";
import { sessionRowToJson } from "@/lib/sessions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentEmail: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentEmail: rawStudentEmail } = await params;
  const studentEmail = decodeURIComponent(rawStudentEmail).toLowerCase();
  if (!(await isLinkedParentOf(email, studentEmail))) {
    return NextResponse.json({ error: "Not linked to this student." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select("*")
    .eq("tutee_email", studentEmail)
    .order("datetime", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not load sessions." }, { status: 500 });
  const names = await namesForEmails((data || []).flatMap((s) => [s.tutor_email, s.tutee_email]));
  return NextResponse.json((data || []).map((row) => sessionRowToJson(row, names)));
}
