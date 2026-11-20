'use client';

import { useState, type FormEvent } from 'react';
import { useCity } from '@/components/CityProvider';
import { CITIES, CITY_LABELS, type City } from '@/lib/data/cafeFields';
import { track } from '@/lib/analytics';

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
  // Prefilled from the site-wide city; changing it here changes it everywhere.
  const { city, setCity } = useCity();
  const [copied, setCopied] = useState(false);

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
          city: String(data.get('city') ?? ''),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Something went wrong.');
      setStatus('sent');
      track('waitlist_joined', { city: String(data.get('city') ?? '') });
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

  async function share() {
    const url = `${window.location.origin}/`;
    const text = 'Brew and the City matches you to independent cafés by taste. Join the waitlist:';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Brew and the City', text, url });
        track('waitlist_shared', { method: 'native' });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        track('waitlist_shared', { method: 'copy' });
      }
    } catch {
      // Dismissing the share sheet throws AbortError; nothing to report.
    }
  }

  if (status === 'sent') {
    return (
      <div className="waitlist-success">
        <div className="waitlist-success-mark" aria-hidden="true">
          ✓
        </div>
        <p>{message}</p>
        <ol className="waitlist-next">
          <li>We&apos;ll email you once when Brew opens{city ? ` in ${CITY_LABELS[city]}` : ''} — nothing before then.</li>
          <li>People on the list get in first.</li>
          <li>Want it sooner? Tell a friend who loves cafés.</li>
        </ol>
        <button type="button" className="btn btn-ghost" onClick={share}>
          {copied ? 'Link copied ✓' : 'Share Brew with a friend'}
        </button>
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
          <label htmlFor="wl-city">City</label>
          <select
            id="wl-city"
            name="city"
            required
            value={city ?? ''}
            onChange={(e) => setCity(e.target.value as City)}
          >
            <option value="" disabled>
              Choose your city
            </option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {CITY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="waitlist-field">
          <label htmlFor="wl-cafes">
            Your go-to cafés <span className="waitlist-optional">optional</span>
          </label>
          <input
            id="wl-cafes"
            name="goToCafes"
            type="text"
            placeholder="Rosso, Pilot Coffee, that place down the street…"
            maxLength={400}
          />
          <p className="waitlist-hint">Including the ones nobody writes about.</p>
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
      {/* Still has to carry the actual disclosure — what's stored and how to
          get out — so it's compressed rather than cut. */}
      <div className="form-note">
        Stored only to notify you at launch. Unsubscribe any time —{' '}
        <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>.
      </div>
    </>
  );
}
