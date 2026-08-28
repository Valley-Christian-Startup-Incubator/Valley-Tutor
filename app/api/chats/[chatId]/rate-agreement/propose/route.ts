import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant } from "@/lib/chats";
import { rateAgreementRowToJson } from "@/lib/rateAgreements";

// A fresh proposal always inserts a new row — the latest row (by created_at)
// is always "the current state," so this also naturally supports
// renegotiating after a prior rate was already accepted.
export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const chat = await getChatIfParticipant(chatId, email);
  if (!chat) return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const rate = typeof body?.rate === "string" ? body.rate.trim() : "";
  if (!rate) return NextResponse.json({ error: "Enter a rate." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("rate_agreements")
    .insert({
      chat_id: chatId,
      tutor_email: chat.tutor_email,
      tutee_email: chat.tutee_email,
      rate,
      proposed_by: email,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Rate proposal failed", error);
    return NextResponse.json({ error: "Could not propose the rate." }, { status: 500 });
  }
  return NextResponse.json(rateAgreementRowToJson(data));
}
