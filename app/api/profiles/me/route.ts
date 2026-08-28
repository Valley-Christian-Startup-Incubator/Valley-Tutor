import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { profileRowToJson, profileJsonToRow } from "@/lib/profiles";

export async function GET(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("profiles").select("*").eq("email", email).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  return NextResponse.json(profileRowToJson(data));
}

export async function PUT(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("profiles").update(profileJsonToRow(body)).eq("email", email);
  if (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
