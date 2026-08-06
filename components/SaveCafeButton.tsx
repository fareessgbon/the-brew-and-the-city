'use client';

import { useState } from 'react';
import Link from 'next/link';
import { memberFetch } from '@/lib/client/memberFetch';

export function SaveCafeButton({ cafeId, initiallySaved, signedIn }: { cafeId: string; initiallySaved: boolean; signedIn: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!signedIn) {
    return (
      <Link href="/login" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12.5 }}>
        Log in to add
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    setError(false);
    try {
      const response = saved
        ? await memberFetch(`/api/saved-cafes/${cafeId}`, { method: 'DELETE' })
        : await memberFetch('/api/saved-cafes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cafeId }),
          });

      if (!response.ok) {
        throw new Error('Could not update saved cafés.');
      }

      // Only flip the button once the request actually succeeded — it used
      // to optimistically toggle regardless of the response.
      setSaved((prev) => !prev);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button type="button" className={saved ? 'btn btn-primary' : 'btn btn-ghost'} style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={toggle} disabled={busy}>
        {busy ? 'Adding…' : saved ? 'On City List ✓' : 'Save to City List'}
      </button>
      {error ? <span style={{ fontSize: 12, color: 'var(--error, #A8503F)' }}>Couldn&apos;t add — try again.</span> : null}
    </span>
  );
}
