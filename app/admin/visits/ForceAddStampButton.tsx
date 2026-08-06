'use client';

import { useTransition } from 'react';
import { forceAddStamp } from '@/app/admin/actions';

export function ForceAddStampButton({ visitId }: { visitId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm('Force-add a City Card stamp for this visit, overriding its current status?')) return;
        startTransition(() => forceAddStamp(visitId));
      }}
      style={{ padding: '6px 16px', fontSize: 12.5 }}
    >
      Force-add stamp
    </button>
  );
}
