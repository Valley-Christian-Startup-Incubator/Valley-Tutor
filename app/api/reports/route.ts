import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { getChatIfParticipant, namesForEmails } from "@/lib/chats";
import { buildReportSnapshot } from "@/lib/reports";
import { sendEmail, getStaffReportEmails } from "@/lib/email";

const REPORT_TYPES = ["message", "file", "video_session"];

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// Only fires when someone explicitly reports something — never on a normal
// send. The report row is the source of truth (visible in /admin
// regardless of email deliverability); the email is a best-effort nudge on
// top of it, sent to whoever is currently in STAFF_REPORT_EMAILS.
export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { chatId, type, targetId, reason } = body || {};
  if (!chatId || !REPORT_TYPES.includes(type)) {
    return NextResponse.json({ error: "A valid chatId and type are required." }, { status: 400 });
  }

  const chat = await getChatIfParticipant(chatId, email);
  if (!chat) return NextResponse.json({ error: "Not a participant of this chat." }, { status: 403 });

  const reportedEmail = chat.tutor_email === email ? chat.tutee_email : chat.tutor_email;
  const snapshot = await buildReportSnapshot(chatId, type);
  if (!snapshot) return NextResponse.json({ error: "Could not build a report snapshot." }, { status: 500 });

  const supabase = getSupabaseAdmin();
  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      chat_id: chatId,
      reporter_email: email,
      reported_email: reportedEmail,
      type,
      target_id: targetId ? String(targetId) : null,
      reason: reason || null,
      snapshot,
    })
    .select("id")
    .single();

  if (error || !report) {
    console.error("Report insert failed", error);
    return NextResponse.json({ error: "Could not submit the report." }, { status: 500 });
  }

  const names = await namesForEmails([email, reportedEmail]);
  const reporterName = names.get(email) || email;
  const reportedName = names.get(reportedEmail) || reportedEmail;
  const recentMessagesHtml = snapshot.messages
    .slice(-10)
    .map((m) => `<p style="margin:4px 0"><strong>${escapeHtml(names.get(m.sender as string) || (m.sender as string))}:</strong> ${escapeHtml(String(m.text || "(attachment)"))}</p>`)
    .join("");

  sendEmail({
    to: getStaffReportEmails(),
    subject: `Peer Tutoring report: ${type.replace("_", " ")} from ${reporterName}`,
    html: `
      <p><strong>${escapeHtml(reporterName)}</strong> reported a ${escapeHtml(type.replace("_", " "))} involving <strong>${escapeHtml(reportedName)}</strong>.</p>
      ${reason ? `<p><strong>Reason given:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p><strong>Subject:</strong> ${escapeHtml(chat.subject || "General tutoring")}</p>
      <h4>Recent messages</h4>
      ${recentMessagesHtml || "<p>(no messages)</p>"}
      <p>Review the full thread in the admin panel.</p>
    `,
  });

  return NextResponse.json({ id: report.id });
}
