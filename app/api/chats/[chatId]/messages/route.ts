import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipantOrLinkedParent, getLinkedParentEmails, namesForEmails } from "@/lib/chats";
import { messageRowToJson } from "@/lib/messages";
import { sendEmail } from "@/lib/email";

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// Skip a notification if the sender already sent one in this chat within
// this window — a quick back-and-forth ("wait, also—") shouldn't fire an
// email per message. Not a real "have they seen it yet" signal (that's
// still a per-device localStorage marker, see public/data.js), just a
// cheap way to avoid an inbox flood.
const NOTIFY_THROTTLE_MS = 2 * 60 * 1000;

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
  if (!(await getChatIfParticipantOrLinkedParent(chatId, email))) {
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
  const chat = await getChatIfParticipantOrLinkedParent(chatId, email);
  if (!chat) {
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

  // System messages (session accepted/cancelled, etc.) are already visible
  // in-chat and don't need a separate email. Real messages do, unless the
  // sender already fired one recently (see NOTIFY_THROTTLE_MS above).
  if (!data.system) {
    (async () => {
      const since = new Date(Date.now() - NOTIFY_THROTTLE_MS).toISOString();
      const { data: recent } = await supabase
        .from("messages")
        .select("id")
        .eq("chat_id", chatId)
        .eq("sender", email)
        .eq("system", false)
        .neq("id", data.id)
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) return;

      // Recipients: the chat's other direct party (or both, if a linked
      // parent sent this), plus every linked parent of the tutee except
      // whoever just sent the message — parents are "in every chat" their
      // kid is in, so they get the same nudge the tutor/tutee would.
      const recipients = new Set<string>();
      if (email === chat.tutor_email) recipients.add(chat.tutee_email);
      else if (email === chat.tutee_email) recipients.add(chat.tutor_email);
      else {
        recipients.add(chat.tutor_email);
        recipients.add(chat.tutee_email);
      }
      (await getLinkedParentEmails(chat.tutee_email)).forEach((p) => recipients.add(p));
      recipients.delete(email);

      const names = await namesForEmails([email, ...recipients]);
      const senderName = names.get(email) || email;
      const origin = req.headers.get("origin") || new URL(req.url).origin;
      const preview = data.attachment ? `📎 ${(data.attachment as { name?: string }).name || "Attachment"}` : String(data.text || "");
      recipients.forEach((recipientEmail) => {
        sendEmail({
          to: [recipientEmail],
          subject: `${senderName} sent you a message on Valley Tutor`,
          html: `
            <p><strong>${escapeHtml(senderName)}</strong> sent a new message${chat.subject ? ` about <strong>${escapeHtml(chat.subject)}</strong>` : ""}:</p>
            <p style="margin:12px 0;padding:10px 14px;background:#f4f5f6;border-radius:8px;">${escapeHtml(preview)}</p>
            <p><a href="${origin}/app?tab=chats">Reply on Valley Tutor</a></p>`,
        });
      });
    })();
  }

  return NextResponse.json(messageRowToJson(data));
}
