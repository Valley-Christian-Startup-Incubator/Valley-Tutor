import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant } from "@/lib/chats";
import { rateAgreementRowToJson } from "@/lib/rateAgreements";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  if (!(await getChatIfParticipant(chatId, email))) {
    return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("rate_agreements")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Could not load the rate agreement." }, { status: 500 });
  return NextResponse.json(data ? rateAgreementRowToJson(data) : null);
}
