'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Two real clicks, not a native confirm() dialog — a browser confirm() is
// exactly the kind of thing a hand clicks through on autopilot (Enter-key
// muscle memory, dialog stacking, no visual connection to the row it's
// about to affect). This inline version replaces the button's own label
// with an explicit "Confirm delete? / Cancel" pair, so there's no way to
// remove a row without two deliberate, visually distinct clicks on the
// row itself. Soft delete underneath either way (see chat + migration
// 0024) — this is defense in depth, not the only safeguard.
export function AdminDeleteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle');

  async function handleConfirm() {
    setStatus('deleting');
    try {
      const res = await fetch(`/api/admin/survey-responses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus('error');
      setConfirming(false);
    }
  }

  if (status === 'deleting') {
    return <span style={{ fontSize: 12, color: 'var(--whisk)' }}>Deleting…</span>;
  }

  if (confirming) {
    return (
      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#b3402a' }}>Delete this {label}?</span>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            background: '#b3402a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            padding: '3px 10px',
            cursor: 'pointer',
          }}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          style={{ background: 'none', border: 'none', color: 'var(--whisk)', fontSize: 12, cursor: 'pointer', padding: 0 }}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      style={{
        background: 'none',
        border: 'none',
        color: status === 'error' ? '#b3402a' : 'var(--whisk)',
        fontSize: 12,
        cursor: 'pointer',
        padding: 0,
        textDecoration: 'underline',
      }}
    >
      {status === 'error' ? 'Failed — try again' : 'Delete'}
    </button>
  );
}
