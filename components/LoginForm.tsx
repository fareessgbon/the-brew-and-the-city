'use client';

import { useState, type FormEvent } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Status = 'idle' | 'sending' | 'sent' | 'error';

// Magic-link only — no password. Matches the design already implied by
// supabase/migrations/0002's handle_new_user trigger ("whenever someone
// completes magic-link signup"), and skips an entire class of risk (no
// password to hash, leak, or reset) for a gate whose only job is proving
// someone owns the email address, not authenticating an existing identity.
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus('sending');
    try {
      const supabase = createBrowserSupabaseClient();
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setStatus('sent');
      setMessage(`Check ${trimmed} for a sign-in link.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="waitlist-success">
        <div className="waitlist-success-mark" aria-hidden="true">
          ✓
        </div>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <>
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <div className="waitlist-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="waitlist-hint">No password — we&apos;ll email you a link to sign in.</p>
        </div>

        <button type="submit" className="btn btn-primary waitlist-submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send me a sign-in link'}
        </button>
      </form>

      {status === 'error' ? (
        <div className="form-note" style={{ color: 'var(--error, #A8503F)' }}>
          {message}
        </div>
      ) : null}
    </>
  );
}
