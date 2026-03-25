import { auth } from "@clerk/nextjs/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable");
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

  return createClient(supabaseUrl!, supabaseAnonKey!, {
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
export const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseServiceRoleKey || supabaseAnonKey!
);
