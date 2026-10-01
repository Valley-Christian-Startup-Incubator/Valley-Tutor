import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// Called by public/admin.js on load. Admin access is the shared password-only
// /admin session; "email" is the fixed identity recorded for staff actions.
export async function GET(req: NextRequest) {
  const email = await requireAdmin(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email });
}
