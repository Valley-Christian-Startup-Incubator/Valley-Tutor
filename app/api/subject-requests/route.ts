import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { sendEmail, getStaffReportEmails } from "@/lib/email";

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// Fired when a tutee adds a custom "Other" topic that isn't in the course
// catalog (see the Subjects tab's "Don't see your topic? Request it" box).
// The topic itself is already saved as a plain string in their own
// profile.subjects via the normal profile save — this is just a best-effort
// nudge to staff so a coordinator can go try to find/recruit a tutor for it,
// same recipients as the existing report emails (lib/email.ts).
export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  if (!topic) return NextResponse.json({ error: "topic is required." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from("users").select("name").eq("email", email).maybeSingle();
  const name = user?.name || email;

  sendEmail({
    to: getStaffReportEmails(),
    subject: `Peer Tutoring: topic request — "${topic}"`,
    html: `
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) requested help with a topic that isn't in the course catalog:</p>
      <p style="font-size:16px"><strong>${escapeHtml(topic)}</strong></p>
      <p>It's already been added to their "Classes You Need Help With" list — no tutor will auto-match on it until someone adds the same topic to their own profile.</p>`,
  });

  return NextResponse.json({ ok: true });
}
