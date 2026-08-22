import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client for server-side cron jobs and sync writes.
 *
 * Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security. This client
 * must NEVER be shipped to the browser — it's only imported in Route Handlers
 * and server-side scripts.
 *
 * Returns `null` when the env var is missing so callers can degrade gracefully.
 */
let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
