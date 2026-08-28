import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { profileRowToJson } from "@/lib/profiles";

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const callerEmail = await resolveAuthToken(req);
  if (!callerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await params;
  const targetEmail = decodeURIComponent(email).toLowerCase();

  const supabase = getSupabaseAdmin();
  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from("users").select("name, email, role").eq("email", targetEmail).maybeSingle(),
    supabase.from("profiles").select("*").eq("email", targetEmail).maybeSingle(),
  ]);

  if (!user || !profile) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ user, profile: profileRowToJson(profile) });
}
