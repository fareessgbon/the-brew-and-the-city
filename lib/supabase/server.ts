import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

// For use in Server Components, Route Handlers, and Server Actions — reads
// the session from cookies. See lib/supabase/client.ts for the browser
// equivalent, and README.md for required env vars.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY (see lib/supabase/README.md).',
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component with no request/response to write
          // cookies to — safe to ignore as long as middleware refreshes the
          // session (standard @supabase/ssr caveat).
        }
      },
    },
  });
}

// For admin routes only (e.g. app/api/admin/**) — uses the service-role key,
// which bypasses Row Level Security entirely. Never import this in anything
// reachable from a Client Component, and never expose SUPABASE_SERVICE_ROLE_KEY
// with a NEXT_PUBLIC_ prefix.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY (server-only — see lib/supabase/README.md).',
    );
  }
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
