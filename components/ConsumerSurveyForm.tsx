'use client';

import { useState, type FormEvent } from 'react';
import { SurveyMultiSelect } from './SurveyMultiSelect';
import { SurveyProgress } from './SurveyProgress';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const FIND_CAFES_OPTIONS = [
  'Friends or word of mouth',
  'Instagram or TikTok',
  'Google Maps or search',
  'Driving past somewhere',
  'Local events or markets',
  'Food or coffee creators',
  'I usually go to the same places',
  'Other',
];
const RETURN_REASON_OPTIONS = [
  'The quality of the drinks or food',
  'A unique menu or signature items',
  'The atmosphere and overall experience',
  'Friendly staff and great service',
  'Convenience (location, hours, accessibility)',
  'Loyalty rewards or special perks',
  'Other',
];
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

const STEP_TITLES = [
  'Who you are',
  'How do you usually find new cafés? (Choose up to 3)',
  'What makes you go back to a café? (Choose up to 3)',
  'How much do friends influence where you go?',
  'What would make you try somewhere new? (Choose up to 3)',
  'Pricing',
];
const LAST_STEP = STEP_TITLES.length - 1;

// §13.6.2 — the consumer-side validation survey. Still no email (the spec's
// shape for this one), but it now opens by asking for a name (see chat), so
// step 0 gates Next the way the café survey's does. Every step after it
// stays optional. Same step-per-question wizard treatment as
// CafePartnerSurveyForm (see chat) — one <form>, one submit, just gated.
export function ConsumerSurveyForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');

  const [name, setName] = useState('');
  const [howTheyFindCafes, setHowTheyFindCafes] = useState<string[]>([]);
  const [whatMakesThemReturn, setWhatMakesThemReturn] = useState<string[]>([]);
  const [friendsInfluence, setFriendsInfluence] = useState('');
  const [tryNewFor, setTryNewFor] = useState<string[]>([]);
  const [pricing, setPricing] = useState('');
  const [freeText, setFreeText] = useState('');

  // Only step 0 has a required field — the rest are optional, so Next
  // advances freely there.
  function goNext() {
    if (step === 0 && !name.trim()) {
      setStepError('Your name is required.');
      return;
    }
    setStepError('');
    setStep((s) => Math.min(s + 1, LAST_STEP));
  }

  function goBack() {
    setStepError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      howTheyFindCafes,
      whatMakesThemReturn,
      friendsInfluence,
      tryNewFor,
      pricing,
      freeText: freeText.trim(),
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
      setMessage(`Thanks, ${payload.name} — that helps a lot.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return <div className="form-success">{message}</div>;
  }

  return (
    <form
      className="cafe-signup-form"
      onSubmit={handleSubmit}
      // Same off-white treatment as the café survey — scoped here rather
      // than the shared .cafe-signup-form class, which CafePartnerSurveyForm
      // also uses.
      style={{ maxWidth: 640, background: 'var(--porcelain)' }}
    >
      <SurveyProgress step={step} total={STEP_TITLES.length} />
      <div className="label" style={{ margin: '10px 0' }}>
        {step + 1}. {STEP_TITLES[step]}
      </div>

      {step === 0 ? (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name">Your name</label>
          <input type="text" id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <SurveyMultiSelect name="howTheyFindCafes" options={FIND_CAFES_OPTIONS} selected={howTheyFindCafes} onChange={setHowTheyFindCafes} max={3} />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <SurveyMultiSelect name="whatMakesThemReturn" options={RETURN_REASON_OPTIONS} selected={whatMakesThemReturn} onChange={setWhatMakesThemReturn} max={3} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
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
      ) : null}

      {step === 4 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <SurveyMultiSelect name="tryNewFor" options={TRY_NEW_OPTIONS} selected={tryNewFor} onChange={setTryNewFor} max={3} />
        </div>
      ) : null}

      {step === 5 ? (
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
          <textarea id="freeText" name="freeText" rows={3} style={{ width: '100%' }} value={freeText} onChange={(e) => setFreeText(e.target.value)} />
        </div>
      ) : null}

      {stepError ? (
        <div style={{ fontSize: 13, color: '#b3402a', marginBottom: 12 }} role="alert">
          {stepError}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {step > 0 ? (
          <button type="button" className="btn btn-ghost" onClick={goBack}>
            Back
          </button>
        ) : null}
        {step < LAST_STEP ? (
          // Distinct keys on these two buttons, not just a ternary at the
          // same position — otherwise React patches the *same* DOM button's
          // type attribute from "button" to "submit" mid-click when this
          // branch flips (landing on the last step), and the browser
          // submits the form as part of that same click before you ever
          // see the last step's content (see chat — reproduced with
          // Playwright).
          <button key="next-btn" type="button" className="btn btn-primary" onClick={goNext}>
            Next
          </button>
        ) : (
          <button key="submit-btn" type="submit" className="btn btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Submit'}
          </button>
        )}
      </div>
      {status === 'error' ? <div className="cafe-form-success">{message}</div> : null}
    </form>
  );
}
