import { auth } from "@clerk/nextjs/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  }
  return key;
}

function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }
  return key;
}

/**
 * Create a Supabase client scoped to the current Clerk user.
 * Uses the Clerk JWT token so RLS policies are enforced.
 * Use this for all user-facing pages and API routes.
 */
export async function createSupabaseClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  if (!token) {
    throw new Error("No Clerk session token available");
  }

  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

/**
 * Admin Supabase client that bypasses RLS.
 * Use this ONLY for:
 * - Cron jobs (no Clerk session)
 * - Internal processing endpoints
 * - OAuth callbacks (no Clerk session during redirect)
 * - Background token refresh operations
 */
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
  }
  return _supabaseAdmin;
}

// Keep backward-compatible export as a getter
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
