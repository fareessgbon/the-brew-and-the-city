'use client';

import { useState, type FormEvent } from 'react';
import { SurveyMultiSelect } from './SurveyMultiSelect';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const FRIEND_INFLUENCE_OPTIONS = ['A lot', 'Somewhat', 'Occasionally', 'Not much'];
const TRY_NEW_OPTIONS = [
  'A selected full-size drink',
  'Cold brew or drip coffee',
  'Mini specialty drink or tasting item',
  'Pastry or bakery item',
  'Exclusive off-menu item',
  'A limited-time drop',
  'Special event or early access',
  "Perks aren't a big reason I try cafés",
];
const PRICING_OPTIONS = ['Around $10–20', 'Around $20–30', '$30+ if the value was there', 'Would need to see the cafés and benefits first'];

// §13.6.2 — the consumer-side validation survey, 6 steps as labelled
// sections on one page. Deliberately anonymous — no email field, matching
// the spec's own shape for this survey.
export function ConsumerSurveyForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const [friendsInfluence, setFriendsInfluence] = useState('');
  const [tryNewFor, setTryNewFor] = useState<string[]>([]);
  const [pricing, setPricing] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? '';

    const payload = {
      howTheyFindCafes: field('howTheyFindCafes'),
      whatMakesThemReturn: field('whatMakesThemReturn'),
      friendsInfluence,
      tryNewFor,
      pricing,
      freeText: field('freeText'),
    };

    setStatus('sending');
    try {
      const res = await fetch('/api/surveys/consumer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('sent');
      setMessage('Thanks — that helps a lot.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return <div className="form-success">{message}</div>;
  }

  return (
    <form className="cafe-signup-form" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        1–4. How you find cafés today
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="howTheyFindCafes">How do you currently find new cafés?</label>
        <input type="text" id="howTheyFindCafes" name="howTheyFindCafes" placeholder="e.g. Instagram, word of mouth, walking by" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="whatMakesThemReturn">What makes you go back to a café?</label>
        <input type="text" id="whatMakesThemReturn" name="whatMakesThemReturn" />
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, marginBottom: 8 }}>How much do friends influence where you go?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FRIEND_INFLUENCE_OPTIONS.map((option) => (
            <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
              <input
                type="radio"
                name="friendsInfluence"
                value={option}
                checked={friendsInfluence === option}
                onChange={() => setFriendsInfluence(option)}
                style={{ width: 'auto' }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        5. What would make you try somewhere new — choose up to 3
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <SurveyMultiSelect name="tryNewFor" options={TRY_NEW_OPTIONS} selected={tryNewFor} onChange={setTryNewFor} max={3} />
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        6. Pricing
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, marginBottom: 8 }}>
          How much would you realistically spend each month on a coffee membership if it consistently saved you money
          and helped you discover great cafés?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {PRICING_OPTIONS.map((option) => (
            <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
              <input type="radio" name="pricing" value={option} checked={pricing === option} onChange={() => setPricing(option)} style={{ width: 'auto' }} />
              {option}
            </label>
          ))}
        </div>
        <label htmlFor="freeText">What would make you genuinely excited to use Brew and the City? (optional)</label>
        <textarea id="freeText" name="freeText" rows={3} style={{ width: '100%' }} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>
      {status === 'error' ? <div className="cafe-form-success">{message}</div> : null}
    </form>
  );
}
