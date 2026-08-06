'use client';

import { useState, type FormEvent } from 'react';
import { SurveyMultiSelect } from './SurveyMultiSelect';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const LOCATION_COUNTS = ['1', '2–3', '4–10', '10+'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PARTS_OF_DAY = ['Morning', 'Midday', 'Afternoon', 'Evening'];
const OFFER_OPTIONS = [
  'A selected full-size drink',
  'Drip coffee',
  'Cold brew',
  'Espresso or small item',
  'Mini specialty drink',
  'Pastry or bakery item',
  'Tasting item',
  'Exclusive off-menu item',
  'Limited-time special',
  'Not sure',
];
const CONCERN_OPTIONS = [
  'Too many redemptions at once',
  'People claiming the item and buying nothing else',
  'Product cost',
  'Staff confusion',
  'Fraud or screenshots',
  'Slowing down service',
  'Existing customers abusing it',
  'Not knowing if the customer returns',
  'Not concerned',
  'Other',
];
const RESULTS_OPTIONS = [
  'New customers',
  'More traffic in slow periods',
  'Additional purchases',
  'Customers returning',
  'More saves or shares',
  'Social awareness',
  'Strong performance on one item',
  'Useful reporting and insights',
];
const WILLINGNESS_OPTIONS = [
  'Very open to it',
  'Open to testing it',
  'Want to understand redemption limits first',
  'Want to know the type of customer it brings',
  'Concerned about the cost',
  'Not sure yet',
];

// §13.6.1 — the café-side validation survey, 5 steps as labelled sections
// on one page (see SurveyMultiSelect for why not a JS wizard).
export function CafePartnerSurveyForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const [locationCount, setLocationCount] = useState('');
  const [slowerDays, setSlowerDays] = useState<string[]>([]);
  const [slowerParts, setSlowerParts] = useState<string[]>([]);
  const [offerTypes, setOfferTypes] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [resultsThatMatter, setResultsThatMatter] = useState<string[]>([]);
  const [willingness, setWillingness] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? '';

    const cafeName = field('cafeName');
    const email = field('email');
    if (!cafeName || !email) return;

    const payload = {
      cafeName,
      contactName: field('contactName'),
      email,
      cityArea: field('cityArea'),
      instagramOrWebsite: field('instagramOrWebsite'),
      locationCount,
      slowerDays,
      slowerParts,
      offerTypes,
      concerns,
      resultsThatMatter,
      willingness,
      freeText: field('freeText'),
    };

    setStatus('sending');
    try {
      const res = await fetch('/api/surveys/cafe-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('sent');
      setMessage(`Thanks — we've got ${cafeName}. Watch ${email} for a note from us.`);
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
        1. Who you are
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="cafeName">Café name</label>
          <input type="text" id="cafeName" name="cafeName" required />
        </div>
        <div>
          <label htmlFor="contactName">Contact name</label>
          <input type="text" id="contactName" name="contactName" />
        </div>
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label htmlFor="cityArea">City / area</label>
          <input type="text" id="cityArea" name="cityArea" placeholder="e.g. Beltline, Calgary" />
        </div>
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div>
          <label htmlFor="instagramOrWebsite">Instagram or website</label>
          <input type="text" id="instagramOrWebsite" name="instagramOrWebsite" placeholder="@yourcafe" />
        </div>
        <div>
          <label htmlFor="locationCount">Number of locations</label>
          <select id="locationCount" name="locationCount" value={locationCount} onChange={(e) => setLocationCount(e.target.value)}>
            <option value="">Select one</option>
            {LOCATION_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        2. When you&apos;re slow
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13.5, marginBottom: 8 }}>Which days are usually slower?</div>
          <SurveyMultiSelect name="slowerDays" options={DAYS} selected={slowerDays} onChange={setSlowerDays} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, marginBottom: 8 }}>Which parts of the day are usually slower?</div>
          <SurveyMultiSelect name="slowerParts" options={PARTS_OF_DAY} selected={slowerParts} onChange={setSlowerParts} />
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        3. What you&apos;d offer — choose up to 3
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <SurveyMultiSelect name="offerTypes" options={OFFER_OPTIONS} selected={offerTypes} onChange={setOfferTypes} max={3} />
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        4. What worries you, and what you want
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13.5, marginBottom: 8 }}>Concerns — up to 3</div>
          <SurveyMultiSelect name="concerns" options={CONCERN_OPTIONS} selected={concerns} onChange={setConcerns} max={3} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, marginBottom: 8 }}>Results that matter most — up to 3</div>
          <SurveyMultiSelect name="resultsThatMatter" options={RESULTS_OPTIONS} selected={resultsThatMatter} onChange={setResultsThatMatter} max={3} />
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        5. Willingness
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {WILLINGNESS_OPTIONS.map((option) => (
            <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
              <input type="radio" name="willingness" value={option} checked={willingness === option} onChange={() => setWillingness(option)} style={{ width: 'auto' }} />
              {option}
            </label>
          ))}
        </div>
        <label htmlFor="freeText">What would make you genuinely interested in becoming a partner? (optional)</label>
        <textarea id="freeText" name="freeText" rows={3} style={{ width: '100%' }} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>
      {status === 'error' ? <div className="cafe-form-success">{message}</div> : null}
    </form>
  );
}
