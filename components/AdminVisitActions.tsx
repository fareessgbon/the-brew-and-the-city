'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Approve/reject for one pending receipt (POST /api/admin/visits/[id]/…).
// No confirm step, unlike AdminRejectButton's rejection email — neither
// action here sends anything to the member, and both are reversible in the
// sense that a mis-click just needs the other button pressed next (a
// wrongly-rejected visit can be re-uploaded; a wrongly-approved one can
// have its reward corrected by hand, same as any admin data-entry slip).
export function AdminVisitActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'approve' | 'reject') {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/visits/${id}/${action}`, { method: 'POST' });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Couldn't ${action} that visit.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Couldn't ${action} that visit.`);
      setPending(null);
    }
  }

  return (
    <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => act('approve')}
        disabled={pending !== null}
        style={{
          background: 'var(--ceremony)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          padding: '5px 12px',
          cursor: pending ? 'default' : 'pointer',
          opacity: pending === 'reject' ? 0.5 : 1,
        }}
      >
        {pending === 'approve' ? 'Approving…' : 'Approve'}
      </button>
      <button
        type="button"
        onClick={() => act('reject')}
        disabled={pending !== null}
        style={{
          background: 'none',
          border: '1px solid var(--whisk-10)',
          color: 'var(--whisk)',
          borderRadius: 6,
          fontSize: 12,
          padding: '5px 12px',
          cursor: pending ? 'default' : 'pointer',
          opacity: pending === 'approve' ? 0.5 : 1,
        }}
      >
        {pending === 'reject' ? 'Rejecting…' : 'Reject'}
      </button>
      {error ? <span style={{ fontSize: 12, color: '#b3402a' }}>{error}</span> : null}
    </span>
  );
}
