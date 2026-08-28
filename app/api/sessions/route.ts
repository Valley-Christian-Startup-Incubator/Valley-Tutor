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

// Only a tutor schedules — mirrors the old client-side handleScheduleTabSubmit.
export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { chatId, datetime, durationMinutes, zoomLink } = body || {};
  if (!chatId || !datetime) {
    return NextResponse.json({ error: "chatId and datetime are required." }, { status: 400 });
  }
  if (zoomLink && !/^https?:\/\//i.test(zoomLink)) {
    return NextResponse.json({ error: "Zoom link should start with http:// or https://" }, { status: 400 });
  }
  const when = new Date(datetime);
  if (Number.isNaN(when.getTime()) || when < new Date()) {
    return NextResponse.json({ error: "Pick a time in the future." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: chat } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
  if (!chat || chat.tutor_email !== email) {
    return NextResponse.json({ error: "Only the tutor on this chat can schedule a session." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .insert({
      chat_id: chatId,
      tutor_email: chat.tutor_email,
      tutee_email: chat.tutee_email,
      subject: chat.subject,
      datetime: when.toISOString(),
      duration_minutes: Number(durationMinutes) || 30,
      zoom_link: zoomLink || "",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Session creation failed", error);
    return NextResponse.json({ error: "Could not schedule the session." }, { status: 500 });
  }
  const names = await namesForEmails([chat.tutor_email, chat.tutee_email]);
  return NextResponse.json(sessionRowToJson(data, names));
}
