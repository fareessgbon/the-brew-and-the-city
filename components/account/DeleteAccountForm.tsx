'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Status = 'idle' | 'confirming' | 'deleting' | 'error';

export function DeleteAccountForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState('');

  async function handleDelete() {
    setStatus('deleting');
    setMessage('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete your account.');

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStatus('confirming')}
        style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--error, #A8503F)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="notice-box" style={{ maxWidth: 420 }}>
      <div style={{ fontSize: 13.5, marginBottom: 10 }}>
        This permanently deletes your profile, Your Taste, City List, City Card history, and receipt photos —
        immediately, not after a delay. It can&apos;t be undone. Type <strong>DELETE</strong> to confirm.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          disabled={status === 'deleting'}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--whisk-10)' }}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={confirmText !== 'DELETE' || status === 'deleting'}
          onClick={handleDelete}
          style={{ padding: '8px 16px', fontSize: 13, background: 'var(--error, #A8503F)' }}
        >
          {status === 'deleting' ? 'Deleting…' : 'Permanently delete'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setStatus('idle');
          setConfirmText('');
        }}
        disabled={status === 'deleting'}
        style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, fontSize: 12.5, color: 'var(--whisk)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Cancel
      </button>
      {status === 'error' ? <div style={{ fontSize: 12.5, color: 'var(--error, #A8503F)', marginTop: 10 }}>{message}</div> : null}
    </div>
  );
}
