import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, requireAuth } from "@/lib/adminSession";

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  const res = NextResponse.json({ ok: true, redirect: "/admin/login" });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
