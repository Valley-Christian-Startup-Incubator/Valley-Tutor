import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { namesForEmails } from "@/lib/chats";

function reportRowToJson(row: Record<string, unknown>, names: Map<string, string>) {
  return {
    id: row.id,
    chatId: row.chat_id,
    reporterEmail: row.reporter_email,
    reporterName: names.get(row.reporter_email as string) ?? null,
    reportedEmail: row.reported_email,
    reportedName: row.reported_email ? names.get(row.reported_email as string) ?? null : null,
    type: row.type,
    targetId: row.target_id,
    reason: row.reason,
    snapshot: row.snapshot,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
  };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load reports." }, { status: 500 });

  const names = await namesForEmails(
    (data || []).flatMap((r) => [r.reporter_email, r.reported_email].filter(Boolean))
  );
  return NextResponse.json((data || []).map((row) => reportRowToJson(row, names)));
}
