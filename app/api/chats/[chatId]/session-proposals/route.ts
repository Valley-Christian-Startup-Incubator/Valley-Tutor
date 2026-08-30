import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant, namesForEmails } from "@/lib/chats";
import { sessionRowToJson } from "@/lib/sessions";

// Only the tutee proposes — they book a slot from the tutor's declared
// availability, bundling time *and* rate into one proposal (#6: never
// "scheduled"/"agreed" from a single side). The tutor accepts both together
// via POST /api/sessions/[id]/accept.
export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatIfParticipant(chatId, email);
  if (!chat) return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });
  if (chat.tutee_email !== email) {
    return NextResponse.json({ error: "Only the tutee can propose a session." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { datetime, durationMinutes, rate, zoomLink } = body || {};
  if (!datetime || !rate) {
    return NextResponse.json({ error: "A time and a rate are required." }, { status: 400 });
  }
  if (zoomLink && !/^https?:\/\//i.test(zoomLink)) {
    return NextResponse.json({ error: "Zoom link should start with http:// or https://" }, { status: 400 });
  }
  const when = new Date(datetime);
  if (Number.isNaN(when.getTime()) || when < new Date()) {
    return NextResponse.json({ error: "Pick a time in the future." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
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
      rate,
      proposed_by: email,
      status: "proposed",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Session proposal failed", error);
    return NextResponse.json({ error: "Could not propose the session." }, { status: 500 });
  }
  const names = await namesForEmails([chat.tutor_email, chat.tutee_email]);
  return NextResponse.json(sessionRowToJson(data, names));
}
