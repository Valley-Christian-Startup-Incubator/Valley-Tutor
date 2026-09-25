import { NextRequest } from "next/server";
import { resolveAuthToken } from "@/lib/auth";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Admin access is deliberately not a role or a DB flag — just an email
// allowlist checked against the same bearer token every other route uses.
// Adding/removing a staff member is an env var change, not a migration.
export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const email = await resolveAuthToken(req);
  if (!email) return null;
  return getAdminEmails().includes(email.toLowerCase()) ? email : null;
}
