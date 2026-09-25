import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not an admin." }, { status: 403 });

  const { email } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.disabled !== "boolean") {
    return NextResponse.json({ error: "disabled (boolean) is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .update({ disabled: body.disabled })
    .eq("email", decodeURIComponent(email).toLowerCase())
    .select("email, disabled")
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not update the account." }, { status: 500 });
  return NextResponse.json(data);
}
