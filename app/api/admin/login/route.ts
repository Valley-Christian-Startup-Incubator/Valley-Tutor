import { NextRequest } from "next/server";
import { handleLogin } from "@/lib/adminSession";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  return await handleLogin(request, password);
}
