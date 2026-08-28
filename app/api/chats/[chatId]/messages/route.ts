import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant } from "@/lib/chats";

function messageRowToJson(row: Record<string, unknown>) {
  return {
    id: row.id,
    chatId: row.chat_id,
    sender: row.sender,
    text: row.text,
    attachment: row.attachment,
    system: row.system,
    timestamp: row.created_at,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  if (!(await getChatIfParticipant(chatId, email))) {
    return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  return NextResponse.json((data || []).map(messageRowToJson));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  if (!(await getChatIfParticipant(chatId, email))) {
    return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || (!body.text && !body.attachment)) {
    return NextResponse.json({ error: "A message needs text or an attachment." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender: email,
      text: body.text || "",
      attachment: body.attachment || null,
      system: Boolean(body.system),
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Message insert failed", error);
    return NextResponse.json({ error: "Could not send the message." }, { status: 500 });
  }
  return NextResponse.json(messageRowToJson(data));
}
