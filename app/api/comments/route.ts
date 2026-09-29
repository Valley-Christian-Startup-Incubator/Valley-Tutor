import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { classifyComment } from "@/lib/comments";

export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const tutorEmail = body?.tutorEmail;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const rating = body?.rating;
  if (!tutorEmail || !text) {
    return NextResponse.json({ error: "tutorEmail and text are required." }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 0 || rating > 5 || Math.round(rating * 2) !== rating * 2) {
    return NextResponse.json({ error: "Rating must be between 0 and 5, in 0.5 steps." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Reviews are only left from a chat, after at least one session is logged
  // together — mirrors where the UI puts the review form (see the chat
  // review widget in public/app.js), not the old standalone comment box.
  const { data: chat } = await supabase
    .from("chats")
    .select("logged_sessions")
    .eq("tutor_email", tutorEmail)
    .eq("tutee_email", email)
    .maybeSingle();
  if (!chat || (chat.logged_sessions ?? 0) < 1) {
    return NextResponse.json({ error: "Log a session with this tutor before leaving a review." }, { status: 403 });
  }

  // One review per (tutee, tutor) — a re-submit edits their existing row
  // instead of piling up duplicates that would skew the average rating.
  const { data: existing } = await supabase
    .from("comments")
    .select("id")
    .eq("tutor_email", tutorEmail)
    .eq("author_email", email)
    .maybeSingle();

  const row = { tutor_email: tutorEmail, author_email: email, text, rating, sentiment: classifyComment(text) };
  const { error } = existing
    ? await supabase.from("comments").update(row).eq("id", existing.id)
    : await supabase.from("comments").insert(row);

  if (error) {
    console.error("Comment save failed", error);
    return NextResponse.json({ error: "Could not save your review." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
