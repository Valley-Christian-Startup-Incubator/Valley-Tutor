import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — matches the app's casual, per-tab session model

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function issueAuthToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("auth_tokens").insert({
    token,
    user_email: email,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`Failed to issue auth token: ${error.message}`);
  return token;
}

export async function revokeAuthToken(token: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("auth_tokens").delete().eq("token", token);
}

// The only source of truth for "who is making this request" — never trust a
// client-supplied email field for authorization. Every route that needs to
// know the caller's identity should resolve it through this.
export async function resolveAuthToken(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("auth_tokens")
    .select("user_email, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.user_email;
}
