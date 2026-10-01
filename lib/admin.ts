import { NextRequest } from "next/server";
import { ADMIN_IDENTITY, hasAdminSession } from "@/lib/adminSession";

// Still used by signup to let allowlisted staff emails register from outside
// the school domain. It no longer grants admin access by itself.
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Admin access = a valid session from the shared password-only /admin login
// (lib/adminSession.ts). Returns the identity to record for staff actions
// (a fixed "admin"), or null when not signed in.
export async function requireAdmin(req: NextRequest): Promise<string | null> {
  return hasAdminSession(req) ? ADMIN_IDENTITY : null;
}
