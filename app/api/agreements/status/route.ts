import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agreements")
    .select("signed_at")
    .eq("user_email", email.toLowerCase())
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check agreement status", error);
    return NextResponse.json({ error: "Could not check agreement status." }, { status: 500 });
  }

  return NextResponse.json({ signed: Boolean(data), signedAt: data?.signed_at ?? null });
}
