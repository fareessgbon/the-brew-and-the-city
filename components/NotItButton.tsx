'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function NotItButton({ cafeId, signedIn }: { cafeId: string; signedIn: boolean }) {
  const [status, setStatus] = useState<Status>('idle');
  if (!signedIn) return null;

  async function submit() {
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback/not-it', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <span style={{ fontSize: 12, color: 'var(--whisk)' }}>Noted.</span>;
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={submit}
        style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--error, #A8503F)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Couldn&apos;t save — retry?
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={status === 'sending'}
      style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--whisk)', textDecoration: 'underline', cursor: 'pointer' }}
    >
      {status === 'sending' ? 'Saving…' : 'Not it'}
    </button>
  );
}
