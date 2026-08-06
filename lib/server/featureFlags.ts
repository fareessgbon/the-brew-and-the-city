import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import type { FeatureFlagKey } from '@/lib/supabase/types';

// §11 — checked here, in the actual request-handling code, not just used to
// hide a button in the UI. `cache()` memoizes within a single request/render
// pass so a route that checks several flags (or a page that both reads a
// flag and renders around it) doesn't re-query per call — it's still a real
// per-request DB read, not a long-lived process-wide cache that could serve
// a stale value after an admin flips a flag.
export const getFeatureFlags = cache(async (): Promise<Record<FeatureFlagKey, boolean>> => {
  const supabase = createAdminClient();
  const { data } = await supabase.from('feature_flags').select('key, enabled');
  const flags = Object.fromEntries((data ?? []).map((f) => [f.key, f.enabled])) as Record<FeatureFlagKey, boolean>;
  // A flag missing from the table (shouldn't happen post-seed, but a fresh
  // environment mid-migration is possible) fails open rather than silently
  // blocking a feature nobody meant to disable.
  return flags;
});

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] ?? true;
}
