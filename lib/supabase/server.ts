import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

// The pre-launch site's original writes (waitlist, survey_responses) still
// go through this service-role client from an unauthenticated visitor's
// POST, validated and rate-limited server-side (see app/api/waitlist and
// app/api/surveys/*) — that path has no session and never will.
//
// Never import this in anything reachable from a Client Component, and
// never expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix.
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

// Session-aware server client — the /discover account gate (see proxy.ts).
// Uses the anon key, not the service role: it only ever acts as the signed-
// in visitor, subject to RLS, the same as the browser client in
// lib/supabase/client.ts. Cookie writes are wrapped in try/catch because a
// Server Component can't set cookies (only Route Handlers and Server
// Actions can) — proxy.ts is what actually refreshes the session cookie on
// every request; a Server Component calling this only ever needs to read it.
export async function createSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase session client is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and ' +
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
          // Called from a Server Component render — proxy.ts already
          // refreshes the session cookie on the request, so this is safe
          // to ignore rather than throw.
        }
      },
    },
  });
}
