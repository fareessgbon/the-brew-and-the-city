'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

// §0.4 — still not an account: no auth, no magic link, no user row. It's a
// waitlist row that now carries a name and the cafés someone already goes
// to, because "which cafés do Calgarians name unprompted" is the single
// most useful thing this list can tell us before launch.
//
// Email is the only required field. The other two are framed as an
// invitation rather than a form to complete — a longer form that people
// abandon collects strictly less than a short one they finish.
export function WaitlistForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim();
    if (!email) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: String(data.get('name') ?? ''),
          goToCafes: String(data.get('goToCafes') ?? ''),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Something went wrong.');
      setStatus('sent');
      const who = String(data.get('name') ?? '').trim().split(' ')[0];
      setMessage(
        payload.alreadyJoined
          ? `${email} is already on the list — you're set.`
          : who
            ? `You're on the list, ${who}. We'll email ${email} the moment it's ready.`
            : `You're on the list. We'll email ${email} the moment it's ready.`,
      );
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
        <div className="waitlist-row">
          <div className="waitlist-field">
            <label htmlFor="wl-name">
              First name <span className="waitlist-optional">optional</span>
            </label>
            <input
              id="wl-name"
              name="name"
              type="text"
              autoComplete="given-name"
              placeholder="Sam"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="waitlist-field">
            <label htmlFor="wl-email">Email</label>
            <input id="wl-email" name="email" type="email" autoComplete="email" placeholder="you@email.com" required />
          </div>
        </div>

        <div className="waitlist-field">
          <label htmlFor="wl-cafes">
            Your go-to cafés <span className="waitlist-optional">optional</span>
          </label>
          <input
            id="wl-cafes"
            name="goToCafes"
            type="text"
            placeholder="Rosso, Phil &amp; Sebastian, that place on 17th…"
            maxLength={400}
          />
          <p className="waitlist-hint">
            Name a few and we&apos;ll make sure they&apos;re in on day one — including the ones nobody writes about.
          </p>
        </div>

        <button type="submit" className="btn btn-primary waitlist-submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Joining…' : name.trim() ? `Join the list, ${name.trim().split(' ')[0]}` : 'Join the list'}
        </button>
      </form>

      {status === 'error' ? (
        <div className="form-note" style={{ color: 'var(--error, #A8503F)' }}>
          {message}
        </div>
      ) : null}
      <div className="form-note">
        Your email, and whatever else you choose to add — stored to notify you at launch, nothing more, no account.
        Unsubscribe any time by emailing <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>.
      </div>
    </>
  );
}
