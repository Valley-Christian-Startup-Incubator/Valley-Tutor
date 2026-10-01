// Liveness probe for the admin data pages — no secrets, no data. Requires the
// admin session (everything under /api/admin is signed-in only).
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/adminSession";

export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, service: "vcs-admin", time: new Date().toISOString() });
}
