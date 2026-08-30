const RESEND_API_URL = "https://api.resend.com/emails";

export function getStaffReportEmails(): string[] {
  return (process.env.STAFF_REPORT_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

// Best-effort — a failed send should never block the report itself from
// being recorded, since the database row (not the email) is the source of
// truth staff review from /admin. Callers should not await this inside a
// try/catch that would roll back the report insert.
export async function sendEmail({ to, subject, html }: { to: string[]; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey || to.length === 0) {
    console.warn(`Email not sent (no RESEND_API_KEY or no recipients configured yet): "${subject}"`);
    return;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Resend send threw:", err);
  }
}
