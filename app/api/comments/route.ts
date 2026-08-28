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
  if (!tutorEmail || !text) {
    return NextResponse.json({ error: "tutorEmail and text are required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("comments").insert({
    tutor_email: tutorEmail,
    author_email: email,
    text,
    sentiment: classifyComment(text),
  });

  if (error) {
    console.error("Comment insert failed", error);
    return NextResponse.json({ error: "Could not save your feedback." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
