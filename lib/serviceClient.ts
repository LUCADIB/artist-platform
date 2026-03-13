import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with service role privileges.
 * This client bypasses Row Level Security (RLS) and should only be used
 * in server-side API routes where elevated privileges are required.
 *
 * IMPORTANT: Never expose this client to the browser.
 */
export function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
