import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";

// Aggregate, read-only stats for a tutor: total sessions/hours logged
// across every chat they're in (see app/api/chats/[chatId]/log), plus their
// average rating and rating count from visible (warm) reviews. Any signed-in
// user can look this up — a tutor for their own profile, or a tutee
// browsing a tutor's profile before matching with them.
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const caller = await resolveAuthToken(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email: rawEmail } = await params;
  const tutorEmail = decodeURIComponent(rawEmail).toLowerCase();

  const supabase = getSupabaseAdmin();
  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select("logged_sessions, logged_hours")
    .eq("tutor_email", tutorEmail);
  if (chatsError) return NextResponse.json({ error: "Could not load session stats." }, { status: 500 });

  const totals = (chats || []).reduce(
    (acc, c) => {
      acc.sessions += c.logged_sessions ?? 0;
      acc.hours += c.logged_hours ?? 0;
      return acc;
    },
    { sessions: 0, hours: 0 }
  );

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("rating")
    .eq("tutor_email", tutorEmail)
    .eq("sentiment", "warm")
    .not("rating", "is", null);
  if (commentsError) return NextResponse.json({ error: "Could not load rating stats." }, { status: 500 });

  const ratings = (comments || []).map((c) => c.rating as number);
  const ratingCount = ratings.length;
  const averageRating = ratingCount ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratingCount) * 10) / 10 : null;

  return NextResponse.json({
    sessions: totals.sessions,
    hours: Math.round(totals.hours * 100) / 100,
    averageRating,
    ratingCount,
  });
}
