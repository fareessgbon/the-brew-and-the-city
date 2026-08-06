'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'saving' | 'success' | 'error';

const NEIGHBOURHOODS = [
  'Beltline',
  'Mission / 17th Ave',
  'Kensington',
  'Inglewood',
  'Bridgeland',
  'Downtown / Stephen Ave',
  'Other Calgary neighbourhood',
];

export function CafeApplicationForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const cafeName = (form.elements.namedItem('cafeName') as HTMLInputElement).value.trim();
    const cafeEmail = (form.elements.namedItem('cafeEmail') as HTMLInputElement).value.trim();
    const neighbourhood = (form.elements.namedItem('cafeNeighbourhood') as HTMLSelectElement).value;
    const instagram = (form.elements.namedItem('cafeInstagram') as HTMLInputElement).value.trim();
    if (!cafeName || !cafeEmail || !neighbourhood) return;

    setStatus('saving');
    try {
      const res = await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeName, email: cafeEmail, neighbourhood, instagram: instagram || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      setStatus('success');
      setMessage(`Thanks — we've got ${cafeName} in ${neighbourhood}. Watch ${cafeEmail} for a note from us within 2 business days.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again, or email us directly at hello@brewandthecity.com.');
    }
  }

  if (status === 'success') {
    return <div className="cafe-form-success">{message}</div>;
  }

  return (
    <form className="cafe-signup-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <div>
          <label htmlFor="cafeName">Café name</label>
          <input type="text" id="cafeName" name="cafeName" placeholder="e.g. Sought x Found" required />
        </div>
        <div>
          <label htmlFor="cafeEmail">Contact email</label>
          <input type="email" id="cafeEmail" name="cafeEmail" placeholder="owner@yourcafe.com" required />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="cafeNeighbourhood">Neighbourhood</label>
          <select id="cafeNeighbourhood" name="cafeNeighbourhood" required defaultValue="">
            <option value="">Select one</option>
            {NEIGHBOURHOODS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cafeInstagram">Instagram (optional)</label>
          <input type="text" id="cafeInstagram" name="cafeInstagram" placeholder="@yourcafe" />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
        {status === 'saving' ? 'Sending…' : 'Apply as a Founding Partner'}
      </button>
      {status === 'error' ? <div className="cafe-form-success">{message}</div> : null}
      <div className="cafe-form-note">
        We reply within 2 business days to set up the 45-minute onboarding visit. Prefer email? Write to{' '}
        <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a> directly. By applying you agree to our{' '}
        <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms</a>.
      </div>
    </form>
  );
}
