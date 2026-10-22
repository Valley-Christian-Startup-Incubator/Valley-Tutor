import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { profileRowToJson } from "@/lib/profiles";

// A parent's linked children, with enough of each one's profile to show on
// the parent dashboard (name, grade, subjects).
export async function GET(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: links, error } = await supabase.from("parent_links").select("student_email").eq("parent_email", email);
  if (error) return NextResponse.json({ error: "Could not load linked children." }, { status: 500 });

  const studentEmails = (links || []).map((l) => l.student_email);
  if (studentEmails.length === 0) return NextResponse.json([]);

  const [{ data: users }, { data: profiles }] = await Promise.all([
    supabase.from("users").select("name, email").in("email", studentEmails),
    supabase.from("profiles").select("*").in("email", studentEmails),
  ]);

  const profilesByEmail = new Map((profiles || []).map((row) => [row.email, profileRowToJson(row)]));
  const children = (users || []).map((u) => ({
    email: u.email,
    name: u.name,
    profile: profilesByEmail.get(u.email) || null,
  }));
  return NextResponse.json(children);
}

// Link the caller (must be role="parent") to a tutee by invite code.
export async function POST(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ error: "Enter an invite code." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: caller } = await supabase.from("users").select("role").eq("email", email).maybeSingle();
  if (!caller || caller.role !== "parent") {
    return NextResponse.json({ error: "Only parent accounts can link to a student." }, { status: 403 });
  }

  const { data: student } = await supabase.from("users").select("email, name, role").eq("invite_code", code).maybeSingle();
  if (!student || student.role !== "tutee") {
    return NextResponse.json({ error: "That code doesn't match a student account." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("parent_links")
    .select("id")
    .eq("parent_email", email)
    .eq("student_email", student.email)
    .maybeSingle();
  if (existing) return NextResponse.json({ email: student.email, name: student.name });

  const { error: insertError } = await supabase
    .from("parent_links")
    .insert({ parent_email: email, student_email: student.email });
  if (insertError) {
    console.error("Parent link insert failed", insertError);
    return NextResponse.json({ error: "Could not link that account." }, { status: 500 });
  }
  return NextResponse.json({ email: student.email, name: student.name });
}
