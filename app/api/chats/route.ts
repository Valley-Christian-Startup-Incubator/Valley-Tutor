import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { chatRowToJson, namesForEmails } from "@/lib/chats";

export async function GET(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .or(`tutor_email.eq.${email},tutee_email.eq.${email}`)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not load chats." }, { status: 500 });
  const names = await namesForEmails((data || []).flatMap((c) => [c.tutor_email, c.tutee_email]));
  return NextResponse.json((data || []).map((row) => chatRowToJson(row, names)));
}

// Only a tutee calls this — they're the one choosing a tutor to chat with,
// same rule the old client-side startChatWith() enforced.
export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const tutorEmail = body?.tutorEmail;
  const subject = body?.subject ?? "";
  if (typeof tutorEmail !== "string" || !tutorEmail) {
    return NextResponse.json({ error: "tutorEmail is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: caller } = await supabase.from("users").select("role").eq("email", email).maybeSingle();
  if (!caller || caller.role !== "tutee") {
    return NextResponse.json({ error: "Only tutees can start a chat." }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("chats")
    .select("*")
    .eq("tutor_email", tutorEmail)
    .eq("tutee_email", email)
    .maybeSingle();
  const names = await namesForEmails([tutorEmail, email]);
  if (existing) return NextResponse.json(chatRowToJson(existing, names));

  const { data: created, error } = await supabase
    .from("chats")
    .insert({ tutor_email: tutorEmail, tutee_email: email, subject })
    .select("*")
    .single();

  if (error || !created) {
    console.error("Chat creation failed", error);
    return NextResponse.json({ error: "Could not start the chat." }, { status: 500 });
  }
  return NextResponse.json(chatRowToJson(created, names));
}
