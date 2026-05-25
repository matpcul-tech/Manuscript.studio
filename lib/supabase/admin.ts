import { createClient } from '@supabase/supabase-js';

// Service-role Supabase client for server-side workers (Inngest jobs).
// Bypasses RLS, so use ONLY in server-only code paths. Never import this
// from a Client Component or expose it via a public route. The worker uses
// it for two things: updating generation_jobs rows and broadcasting tokens
// on Realtime channels. No cookies, no user session - it's an unattended
// background process.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.'
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
