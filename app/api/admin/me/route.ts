import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// The admin page itself has no server-side session to gate on (bearer
// tokens, not cookies) — it calls this on load and bounces anyone who isn't
// on the allowlist, same as every other client-rendered page in this app.
export async function GET(req: NextRequest) {
  const email = await requireAdmin(req);
  if (!email) return NextResponse.json({ error: "Not an admin." }, { status: 403 });
  return NextResponse.json({ email });
}
