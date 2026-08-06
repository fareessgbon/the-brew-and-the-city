'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function SignupForm({ nextPath }: { nextPath: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value;
    if (!email || !password) return;
    if (password !== confirm) {
      setStatus('error');
      setMessage('Those passwords don’t match.');
      return;
    }

    setStatus('sending');
    setMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
      if (error) throw error;
      track('signup_requested', { source: 'signup_page' });
      setStatus('sent');
      setMessage(`Check ${email} to confirm your account, then sign in.`);
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
      <form className="inline-form" onSubmit={handleSubmit} style={{ maxWidth: 400, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <input type="email" name="email" placeholder="Email" required autoComplete="email" />
        <input type="password" name="password" placeholder="Password (6+ characters)" required minLength={6} autoComplete="new-password" />
        <input type="password" name="confirm" placeholder="Confirm password" required minLength={6} autoComplete="new-password" />
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      {status === 'error' ? <div className="form-success">{message}</div> : null}
      <div className="form-note">
        Already have an account? <Link href="/login">Sign in</Link>. By signing up you agree to our{' '}
        <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.
      </div>
    </>
  );
}
