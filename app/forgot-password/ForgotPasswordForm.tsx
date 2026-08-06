'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!email) return;

    setStatus('sending');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      });
      if (error) throw error;
      track('password_reset_requested', {});
      setStatus('sent');
      // Deliberately the same message whether or not the email exists —
      // confirming which emails have accounts is an enumeration leak.
      setMessage(`If ${email} has an account, we've sent a link to reset the password.`);
    } catch (err) {
      setStatus('error');
      setMessage(friendlyAuthError(err));
    }
  }

  if (status === 'sent') {
    return <div className="form-success">{message}</div>;
  }

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <input type="email" name="email" placeholder="Email" required autoComplete="email" />
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      {status === 'error' ? <div className="form-success">{message}</div> : null}
    </>
  );
}
