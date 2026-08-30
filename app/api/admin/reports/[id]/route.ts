import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reports")
    .update({ status: "reviewed", reviewed_at: new Date().toISOString(), reviewed_by: admin })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not update the report." }, { status: 500 });
  return NextResponse.json(data);
}
