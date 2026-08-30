import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant } from "@/lib/chats";

// What the tutee's booking form needs: the tutor's declared weekly
// availability (so they pick from real open slots, not a blank calendar)
// and the last *accepted* rate for this specific chat, so a renegotiation
// defaults to what was already agreed rather than starting blank (#6).
export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatIfParticipant(chatId, email);
  if (!chat) return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const [{ data: profile }, { data: lastAccepted }] = await Promise.all([
    supabase.from("profiles").select("availability, availability_locations, availability_formats").eq("email", chat.tutor_email).maybeSingle(),
    supabase
      .from("tutoring_sessions")
      .select("rate")
      .eq("chat_id", chatId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    availability: profile?.availability || [],
    availabilityLocations: profile?.availability_locations || {},
    availabilityFormats: profile?.availability_formats || {},
    lastAcceptedRate: lastAccepted?.rate || "",
  });
}
