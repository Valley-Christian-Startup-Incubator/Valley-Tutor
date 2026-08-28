import { NextRequest, NextResponse } from "next/server";
import { revokeAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  if (token) await revokeAuthToken(token);
  return NextResponse.json({ ok: true });
}
