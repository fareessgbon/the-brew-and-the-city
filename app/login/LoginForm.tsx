'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'checking' | 'error';
type ResendStatus = 'idle' | 'sending' | 'sent' | 'error';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  // Set only when the failure was specifically "email not confirmed" — the
  // one login error with an actual next step, not just a message. Without
  // this, the login page's expired-link banner ("request a new one below")
  // pointed at a form with no way to do that — a real dead end for anyone
  // whose confirmation link timed out.
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!email || !password) return;

    setStatus('checking');
    setMessage('');
    setUnconfirmedEmail('');
    setResendStatus('idle');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      track('login_submitted', { source: 'login' });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(friendlyAuthError(err));
      if (err instanceof Error && err.message.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(email);
      }
    }
  }

  async function resendConfirmation() {
    setResendStatus('sending');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: 'signup', email: unconfirmedEmail });
      if (error) throw error;
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit} style={{ maxWidth: 400, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <input type="email" name="email" placeholder="Email" aria-label="Email" required autoComplete="email" />
        <input type="password" name="password" placeholder="Password" aria-label="Password" required autoComplete="current-password" />
        <button type="submit" className="btn btn-primary" disabled={status === 'checking'}>
          {status === 'checking' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {status === 'error' ? <div className="form-success">{message}</div> : null}
      {unconfirmedEmail ? (
        resendStatus === 'sent' ? (
          <div className="form-note">Sent — check {unconfirmedEmail} for a fresh link.</div>
        ) : (
          <div className="form-note">
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resendStatus === 'sending'}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--ceremony)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {resendStatus === 'sending' ? 'Sending…' : 'Resend confirmation email'}
            </button>
            {resendStatus === 'error' ? ' — that didn’t work, try again in a moment.' : null}
          </div>
        )
      ) : null}
      <div className="form-note">
        <Link href="/forgot-password">Forgot password?</Link> · New here?{' '}
        <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create an account</Link>
      </div>
    </>
  );
}
