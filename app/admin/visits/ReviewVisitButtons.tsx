'use client';

import { useTransition } from 'react';
import { reviewVisit } from '@/app/admin/actions';

export function ReviewVisitButtons({ visitId }: { visitId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => startTransition(() => reviewVisit(visitId, 'approve'))}
        style={{ padding: '6px 16px', fontSize: 12.5 }}
      >
        Approve
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={isPending}
        onClick={() => startTransition(() => reviewVisit(visitId, 'reject'))}
        style={{ padding: '6px 16px', fontSize: 12.5 }}
      >
        Reject
      </button>
    </div>
  );
}
