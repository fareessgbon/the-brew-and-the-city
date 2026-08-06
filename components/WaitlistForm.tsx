'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

// §0.4 — the entire account surface of the pre-launch site: one email
// field, stored as a waitlist row, never an account.
export function WaitlistForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!email) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('sent');
      setMessage(data.alreadyJoined ? `${email} is already on the list.` : `You're on the list — we'll email ${email} at launch.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return <div className="form-success">{message}</div>;
  }

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit} style={{ maxWidth: 440 }}>
        <input type="email" name="email" placeholder="you@email.com" aria-label="Email" required autoComplete="email" />
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Joining…' : 'Join the list'}
        </button>
      </form>
      {status === 'error' ? <div className="form-note" style={{ color: 'var(--error, #A8503F)' }}>{message}</div> : null}
      <div className="form-note">
        A single email address, stored to notify you at launch — nothing else, no account.
        Unsubscribe any time by emailing <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>.
      </div>
    </>
  );
}
