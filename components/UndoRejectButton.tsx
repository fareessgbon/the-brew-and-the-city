'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UndoRejectButton({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  async function undo() {
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback/not-it', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus('error');
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={undo}
      disabled={status === 'sending'}
      style={{ padding: '5px 14px', fontSize: 12.5 }}
    >
      {status === 'sending' ? 'Undoing…' : status === 'error' ? 'Couldn’t undo — retry?' : 'Undo'}
    </button>
  );
}
