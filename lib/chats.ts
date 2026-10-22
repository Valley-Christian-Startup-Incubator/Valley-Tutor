import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function namesForEmails(emails: string[]): Promise<Map<string, string>> {
  const supabase = getSupabaseAdmin();
  const unique = Array.from(new Set(emails));
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("users").select("email, name").in("email", unique);
  return new Map((data || []).map((u) => [u.email, u.name]));
}

export async function getChatIfParticipant(chatId: string, email: string) {
  const supabase = getSupabaseAdmin();
  const { data: chat } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
  if (!chat) return null;
  if (chat.tutor_email !== email && chat.tutee_email !== email) return null;
  return chat;
}

export async function isLinkedParentOf(parentEmail: string, studentEmail: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("parent_links")
    .select("id")
    .eq("parent_email", parentEmail)
    .eq("student_email", studentEmail)
    .maybeSingle();
  return Boolean(data);
}

export async function getLinkedParentEmails(studentEmail: string): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("parent_links").select("parent_email").eq("student_email", studentEmail);
  return (data || []).map((r) => r.parent_email as string);
}

// Same as getChatIfParticipant, but also allows a caller who's a linked
// parent of the tutee — used only where a parent should actually reach the
// chat (viewing/posting messages), not the booking-mutation routes.
export async function getChatIfParticipantOrLinkedParent(chatId: string, email: string) {
  const chat = await getChatIfParticipant(chatId, email);
  if (chat) return chat;

  const supabase = getSupabaseAdmin();
  const { data: chatRow } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
  if (!chatRow) return null;
  if (await isLinkedParentOf(email, chatRow.tutee_email)) return chatRow;
  return null;
}

export function chatRowToJson(row: Record<string, unknown>, names?: Map<string, string>) {
  return {
    id: row.id,
    tutorEmail: row.tutor_email,
    tuteeEmail: row.tutee_email,
    tutorName: names?.get(row.tutor_email as string) ?? null,
    tuteeName: names?.get(row.tutee_email as string) ?? null,
    subject: row.subject,
    loggedSessions: row.logged_sessions ?? 0,
    loggedHours: row.logged_hours ?? 0,
    loggedUpdatedBy: row.logged_updated_by ?? null,
    loggedUpdatedAt: row.logged_updated_at ?? null,
    createdAt: row.created_at,
  };
}
