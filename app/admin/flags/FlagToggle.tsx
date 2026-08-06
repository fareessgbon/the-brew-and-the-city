'use client';

import { useTransition } from 'react';
import { setFeatureFlag } from '@/app/admin/actions';
import type { FeatureFlagKey } from '@/lib/supabase/types';

export function FlagToggle({ flagKey, enabled }: { flagKey: FeatureFlagKey; enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'none', flexShrink: 0 }}>
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => startTransition(() => setFeatureFlag(flagKey, e.target.checked))}
        style={{ width: 'auto' }}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </label>
  );
}
