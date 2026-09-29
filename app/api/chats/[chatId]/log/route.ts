import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant, chatRowToJson, namesForEmails } from "@/lib/chats";

// Either the tutor or the tutee can log that they did a session together —
// there's no formal per-session record backing this (that's the separate
// proposeSession/accept booking flow), just a running count + hours total
// on the chat itself, since not every real-world session goes through a
// formal booking. This also gates when the tutee can leave a rating/review
// (see app/api/comments/route.ts) — at least one logged session required.
export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const hours = body?.hours;
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0 || hours > 24) {
    return NextResponse.json({ error: "Hours must be a number between 0 and 24." }, { status: 400 });
  }

  const { chatId } = await params;
  const chat = await getChatIfParticipant(chatId, email);
  if (!chat) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chats")
    .update({
      logged_sessions: (chat.logged_sessions ?? 0) + 1,
      logged_hours: Math.round(((chat.logged_hours ?? 0) + hours) * 100) / 100,
      logged_updated_by: email,
      logged_updated_at: new Date().toISOString(),
    })
    .eq("id", chatId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Chat session log failed", error);
    return NextResponse.json({ error: "Could not log the session." }, { status: 500 });
  }
  const names = await namesForEmails([data.tutor_email, data.tutee_email]);
  return NextResponse.json(chatRowToJson(data, names));
}
