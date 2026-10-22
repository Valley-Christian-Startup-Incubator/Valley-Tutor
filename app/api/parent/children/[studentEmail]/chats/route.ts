import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { chatRowToJson, namesForEmails, isLinkedParentOf } from "@/lib/chats";

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
    .from("chats")
    .select("*")
    .eq("tutee_email", studentEmail)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not load chats." }, { status: 500 });
  const names = await namesForEmails((data || []).flatMap((c) => [c.tutor_email, c.tutee_email]));
  return NextResponse.json((data || []).map((row) => chatRowToJson(row, names)));
}
