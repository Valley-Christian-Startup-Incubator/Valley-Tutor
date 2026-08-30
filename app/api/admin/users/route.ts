import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, disabled, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  return NextResponse.json(data || []);
}
