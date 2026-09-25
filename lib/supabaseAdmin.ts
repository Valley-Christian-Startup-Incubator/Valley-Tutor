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

// SUPABASE_URL is the address the *server* uses to reach Supabase — on the
// Mac Studio that's http://localhost:8000, since the app and DB run on the
// same box and there's no reason to round-trip through the public tunnel for
// server-to-server calls. But any URL handed back to the browser (e.g. a
// signed Storage download link) has to resolve from the browser's network,
// so it must use the public hostname instead. SUPABASE_PUBLIC_URL defaults
// to SUPABASE_URL when unset (e.g. local dev, where they're already the same
// public tunnel URL), so this is a no-op there.
export function toPublicSupabaseUrl(url: string): string {
  const internal = process.env.SUPABASE_URL;
  const external = process.env.SUPABASE_PUBLIC_URL || process.env.SUPABASE_URL;
  if (!internal || !external || internal === external) return url;
  return url.replace(internal, external);
}
