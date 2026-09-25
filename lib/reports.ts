import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { messageRowToJson } from "@/lib/messages";
import { sessionRowToJson } from "@/lib/sessions";
import { chatRowToJson, namesForEmails } from "@/lib/chats";

const SNAPSHOT_MESSAGE_COUNT = 50;

// A copy of the relevant thread/session at the moment of the report, stored
// alongside the report row rather than just referencing live data — so the
// evidence survives even if the underlying chat/session is later changed or
// deleted, and staff reviewing it later see exactly what was reported.
export async function buildReportSnapshot(chatId: string, type: "message" | "file" | "video_session") {
  const supabase = getSupabaseAdmin();
  const { data: chatRow } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
  if (!chatRow) return null;

  const names = await namesForEmails([chatRow.tutor_email, chatRow.tutee_email]);
  const chat = chatRowToJson(chatRow, names);

  const { data: messageRows } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(SNAPSHOT_MESSAGE_COUNT);
  const messages = (messageRows || []).reverse().map(messageRowToJson);

  let sessions: ReturnType<typeof sessionRowToJson>[] = [];
  if (type === "video_session") {
    const { data: sessionRows } = await supabase
      .from("tutoring_sessions")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false });
    sessions = (sessionRows || []).map((row) => sessionRowToJson(row, names));
  }

  return { chat, messages, sessions, capturedAt: new Date().toISOString() };
}
