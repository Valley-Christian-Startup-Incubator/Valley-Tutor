import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant } from "@/lib/chats";
import { rateAgreementRowToJson } from "@/lib/rateAgreements";

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  if (!(await getChatIfParticipant(chatId, email))) {
    return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data: latest } = await supabase
    .from("rate_agreements")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest || latest.status !== "pending") {
    return NextResponse.json({ error: "There's no pending rate to accept." }, { status: 400 });
  }
  if (latest.proposed_by === email) {
    return NextResponse.json({ error: "The other person needs to accept your proposal." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rate_agreements")
    .update({ status: "accepted", accepted_by: email, accepted_at: new Date().toISOString() })
    .eq("id", latest.id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Rate acceptance failed", error);
    return NextResponse.json({ error: "Could not accept the rate." }, { status: 500 });
  }
  return NextResponse.json(rateAgreementRowToJson(data));
}
