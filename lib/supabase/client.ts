import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Session-aware client for Client Components — the browser half of the
// Discover account gate (see proxy.ts and lib/supabase/server.ts's
// createSessionClient). Reads/writes the same cookies @supabase/ssr's
// server-side helpers use, so a sign-in here is immediately visible to the
// next server request. Unlike createAdminClient, this uses the anon key and
// is safe to import from anything the browser can reach — RLS (not this
// client) is what actually limits what it can do.
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase browser client is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY (see lib/supabase/README.md).',
    );
  }
  return createBrowserClient<Database>(url, anonKey);
}
