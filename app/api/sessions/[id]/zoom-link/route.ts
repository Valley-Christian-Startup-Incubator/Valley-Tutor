import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAuthToken } from "@/lib/auth";
import { sessionRowToJson } from "@/lib/sessions";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await resolveAuthToken(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const zoomLink = body?.zoomLink ?? "";
  if (zoomLink && !/^https?:\/\//i.test(zoomLink)) {
    return NextResponse.json({ error: "That doesn't look like a valid link." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase.from("tutoring_sessions").select("tutor_email").eq("id", id).maybeSingle();
  if (!session || session.tutor_email !== email) {
    return NextResponse.json({ error: "Only the tutor on this session can edit the Zoom link." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .update({ zoom_link: zoomLink })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Zoom link update failed", error);
    return NextResponse.json({ error: "Could not update the Zoom link." }, { status: 500 });
  }
  return NextResponse.json(sessionRowToJson(data));
}
