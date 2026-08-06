'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'saving' | 'saved' | 'error';

// Supabase's updateUser() will happily change the password for whoever
// holds the current session cookie — it doesn't ask for the old password
// itself. Re-verifying it here first (a fresh signInWithPassword) is what
// actually makes this "require proper authentication" rather than "require
// having left a tab open."
export function ChangePasswordForm({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const currentPassword = (form.elements.namedItem('current') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('new') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value;
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirm) {
      setStatus('error');
      setMessage('Those new passwords don’t match.');
      return;
    }

    setStatus('saving');
    setMessage('');
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (verifyError) throw new Error('Current password is incorrect.');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setStatus('saved');
      setMessage('Password updated.');
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error && err.message === 'Current password is incorrect.' ? err.message : friendlyAuthError(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
      <input type="password" name="current" placeholder="Current password" required autoComplete="current-password" />
      <input type="password" name="new" placeholder="New password (6+ characters)" required minLength={6} autoComplete="new-password" />
      <input type="password" name="confirm" placeholder="Confirm new password" required minLength={6} autoComplete="new-password" />
      <button type="submit" className="btn btn-primary" disabled={status === 'saving'} style={{ padding: '8px 18px', fontSize: 13, alignSelf: 'flex-start' }}>
        {status === 'saving' ? 'Saving…' : 'Change password'}
      </button>
      {message ? (
        <div style={{ fontSize: 12.5, color: status === 'saved' ? 'var(--ceremony)' : 'var(--error, #A8503F)' }}>{message}</div>
      ) : null}
    </form>
  );
}
