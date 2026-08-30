import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";

// Lets someone who signed up under the wrong role fix it without losing
// their account/history — flips users.role in place. Profile fields are
// shared across both roles already (see lib/profiles.ts), so nothing needs
// to be migrated; only which fields the client shows changes.
export async function PATCH(req: NextRequest) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const role = body?.role;
  if (role !== "tutor" && role !== "tutee") {
    return NextResponse.json({ error: "Role must be 'tutor' or 'tutee'." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("users").update({ role }).eq("email", email).select("role").single();
  if (error || !data) {
    console.error("Role switch failed", error);
    return NextResponse.json({ error: "Could not switch roles." }, { status: 500 });
  }
  return NextResponse.json({ role: data.role });
}
