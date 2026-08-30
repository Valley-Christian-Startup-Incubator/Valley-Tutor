import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant } from "@/lib/chats";
import { messageRowToJson } from "@/lib/messages";

// Client-side already restricts this (handleFileSelect in app.js), but that
// alone isn't a real boundary — anyone can call this API directly.
const ALLOWED_ATTACHMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

function attachmentError(attachment: { name?: string; dataUrl?: string } | null | undefined): string | null {
  if (!attachment) return null;
  const name = (attachment.name || "").toLowerCase();
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return "Only PDF, DOC/DOCX, PNG, and JPG files are allowed.";
  }
  const base64Length = (attachment.dataUrl || "").split(",")[1]?.length || 0;
  const approxBytes = base64Length * 0.75;
  if (approxBytes > MAX_ATTACHMENT_BYTES) {
    return "That file is too big (3MB max).";
  }
  return null;
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
  const attachmentIssue = attachmentError(body.attachment);
  if (attachmentIssue) {
    return NextResponse.json({ error: attachmentIssue }, { status: 400 });
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
