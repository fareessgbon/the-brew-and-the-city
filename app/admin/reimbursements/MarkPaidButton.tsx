'use client';

import { useTransition } from 'react';
import { markReimbursementPaid } from '@/app/admin/actions';

export function MarkPaidButton({ rewardId }: { rewardId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={isPending}
      onClick={() => startTransition(() => markReimbursementPaid(rewardId))}
      style={{ padding: '4px 12px', fontSize: 12.5 }}
    >
      Mark paid
    </button>
  );
}
