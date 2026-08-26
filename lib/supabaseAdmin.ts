import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key, which bypasses RLS by
// design. Never import this from client code or a "use client" component —
// the service role key must never reach the browser. RLS on every table
// stays enabled with no policies (see the auto-enable trigger on the DB),
// so this server-side client is the *only* way in.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
