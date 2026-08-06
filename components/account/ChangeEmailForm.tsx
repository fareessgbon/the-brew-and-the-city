'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'saving' | 'sent' | 'error';

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const newEmail = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!newEmail || newEmail === currentEmail) return;

    setStatus('saving');
    setMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile')}` },
      );
      if (error) throw error;
      setStatus('sent');
      setMessage(`Check ${newEmail} for a confirmation link — your email won’t change until you click it.`);
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage(friendlyAuthError(err));
    }
  }

  if (status === 'sent') {
    return <div style={{ fontSize: 13, color: 'var(--ceremony)' }}>{message}</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, maxWidth: 400 }}>
      <input type="email" name="email" placeholder="New email address" required style={{ flex: 1 }} />
      <button type="submit" className="btn btn-primary" disabled={status === 'saving'} style={{ padding: '8px 18px', fontSize: 13 }}>
        {status === 'saving' ? 'Sending…' : 'Change email'}
      </button>
      {status === 'error' ? <div style={{ fontSize: 12.5, color: 'var(--error, #A8503F)' }}>{message}</div> : null}
    </form>
  );
}
