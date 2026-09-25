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

export function chatRowToJson(row: Record<string, unknown>, names?: Map<string, string>) {
  return {
    id: row.id,
    tutorEmail: row.tutor_email,
    tuteeEmail: row.tutee_email,
    tutorName: names?.get(row.tutor_email as string) ?? null,
    tuteeName: names?.get(row.tutee_email as string) ?? null,
    subject: row.subject,
    createdAt: row.created_at,
  };
}
