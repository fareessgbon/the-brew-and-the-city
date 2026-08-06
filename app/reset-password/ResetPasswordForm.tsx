'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'saving' | 'error';

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    const confirm = (e.currentTarget.elements.namedItem('confirm') as HTMLInputElement).value;
    if (!password) return;
    if (password !== confirm) {
      setStatus('error');
      setMessage('Those passwords don’t match.');
      return;
    }

    setStatus('saving');
    setMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push('/profile');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(friendlyAuthError(err));
    }
  }

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit} style={{ maxWidth: 400, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <input
          type="password"
          name="password"
          placeholder="New password (6+ characters)"
          aria-label="New password (6+ characters)"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <input
          type="password"
          name="confirm"
          placeholder="Confirm new password"
          aria-label="Confirm new password"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save new password'}
        </button>
      </form>
      {status === 'error' ? <div className="form-success">{message}</div> : null}
    </>
  );
}
