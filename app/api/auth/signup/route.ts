import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, issueAuthToken } from "@/lib/auth";
import { getAdminEmails } from "@/lib/admin";

const EMPTY_PROFILE_DEFAULTS = {
  photo: "",
  bio: "",
  class_year: "",
  taken_courses: [],
  subjects: [],
  grade_level: "",
  grade_levels: [],
  availability: [],
  availability_locations: {},
  availability_formats: {},
  intro_video: "",
  rate: "",
  offer: "",
  tutoring_hours: "",
  payment_methods: [],
  payment_handle: "",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const { name, email, password, role } = body;
  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const ALLOWED_DOMAINS = ["@warriorlife.net", "@vcs.net"];
  const normalizedForDomainCheck = email.trim().toLowerCase();
  const isAllowedDomain = ALLOWED_DOMAINS.some((domain) => normalizedForDomainCheck.endsWith(domain));
  const isAllowlistedAdmin = getAdminEmails().includes(normalizedForDomainCheck);
  if (!isAllowedDomain && !isAllowlistedAdmin) {
    return NextResponse.json(
      { error: "Use your @warriorlife.net or @vcs.net school email to sign up." },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }
  if (role !== "tutor" && role !== "tutee") {
    return NextResponse.json({ error: "Role must be 'tutor' or 'tutee'." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.from("users").select("email").eq("email", normalizedEmail).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({ name: name.trim(), email: normalizedEmail, password_hash: passwordHash, role })
    .select("id, name, email, role")
    .single();

  if (insertError || !user) {
    console.error("Signup insert failed", insertError);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ email: normalizedEmail, ...EMPTY_PROFILE_DEFAULTS });
  if (profileError) {
    console.error("Profile row creation failed", profileError);
    return NextResponse.json({ error: "Could not set up your profile." }, { status: 500 });
  }

  const token = await issueAuthToken(normalizedEmail);
  return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
