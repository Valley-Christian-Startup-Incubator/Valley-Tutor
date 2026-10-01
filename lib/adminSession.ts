// Password-only session auth for the combined /admin area (staff tools +
// data dashboard). Ported from the former mulls-monster Data Admin.
//
// A login POSTs a password; on success we set an httpOnly cookie carrying a
// timestamp signed with HMAC-SHA256 using ADMIN_SESSION_SECRET. Route handlers
// and server pages verify the signature. No server-side session store.
//
// This is separate from the student app's bearer-token login (lib/auth.ts).
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "vcsadm";
const MAX_AGE = 60 * 60 * 12; // 12 hours

// Fixed identity recorded for staff actions done through the shared password
// login (e.g. reports.reviewed_by).
export const ADMIN_IDENTITY = "admin";

export const ADMIN_LOGIN_PATH = "/admin/login";

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET env var is required.");
  return s;
}

function adminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD env var is required.");
  return p;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeSessionCookie(): string {
  const payload = `${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

// Constant-time-ish comparison to avoid trivial timing leaks.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  return safeEqual(sig, sign(payload));
}

// In-memory per-IP lockout. Good enough for a single-instance deployment;
// resets on restart, which is fine for a login-attempt throttle.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function handleLogin(request: NextRequest, password: string): Promise<NextResponse> {
  const key = clientKey(request);
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (entry && entry.lockedUntil > now) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  const ok = safeEqual(password, adminPassword());
  if (!ok) {
    const attempts = (entry?.count ?? 0) + 1;
    if (attempts >= MAX_ATTEMPTS) failedAttempts.set(key, { count: 0, lockedUntil: now + LOCKOUT_MS });
    else failedAttempts.set(key, { count: attempts, lockedUntil: 0 });
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }
  failedAttempts.delete(key);
  const res = NextResponse.json({ ok: true, redirect: "/admin" });
  res.headers.set("Set-Cookie", makeSessionCookie());
  return res;
}

// True when the request carries a valid admin session cookie.
export function hasAdminSession(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(COOKIE)?.value);
}

// For route handlers: returns a 401 response when not signed in, else null.
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  if (!hasAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// For server components / pages: redirect to the admin login when signed out.
export async function requireAuthRedirect(): Promise<void> {
  const { cookies } = await import("next/headers");
  const { redirect } = await import("next/navigation");
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE)?.value)) redirect(ADMIN_LOGIN_PATH);
}

export async function isSignedIn(): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}
