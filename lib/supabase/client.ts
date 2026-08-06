import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// For use in Client Components. Throws clearly at call time if env vars
// aren't set yet, rather than silently returning a client that fails on
// first query — see README.md for how to set NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY (see lib/supabase/README.md).',
    );
  }
  return createBrowserClient<Database>(url, anonKey);
}
