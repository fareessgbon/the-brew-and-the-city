import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// This build has no auth and no user sessions — the pre-launch site's only
// two writes (waitlist, survey_responses) go through the service-role
// client from an unauthenticated visitor's POST, validated and rate-limited
// server-side (see app/api/waitlist and app/api/surveys/*). There is no
// session-bound client here because there is no session to bind to.
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
