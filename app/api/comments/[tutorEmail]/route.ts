import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { namesForEmails } from "@/lib/chats";

function commentRowToJson(row: Record<string, unknown>, names?: Map<string, string>) {
  return {
    id: row.id,
    tutorEmail: row.tutor_email,
    authorEmail: row.author_email,
    authorName: names?.get(row.author_email as string) ?? null,
    text: row.text,
    sentiment: row.sentiment,
    createdAt: row.created_at,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tutorEmail: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tutorEmail } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("tutor_email", decodeURIComponent(tutorEmail).toLowerCase())
    .eq("sentiment", "warm")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load feedback." }, { status: 500 });
  const names = await namesForEmails((data || []).map((c) => c.author_email));
  return NextResponse.json((data || []).map((row) => commentRowToJson(row, names)));
}
