'use client';

import { useState, type FormEvent } from 'react';
import { SurveyMultiSelect } from './SurveyMultiSelect';
import { SurveyProgress } from './SurveyProgress';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOCATION_COUNTS = ['1', '2–3', '4–10', '10+'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PARTS_OF_DAY = ['Morning', 'Midday', 'Afternoon', 'Evening'];
const OFFER_OPTIONS = [
  'Complimentary specialty drink (latte, matcha, signature drink, etc.)',
  'Complimentary coffee (drip, espresso, americano, cold brew)',
  'Complimentary pastry or bakery item',
  'Discount on a purchase',
  'Not sure yet',
];
const CONCERN_OPTIONS = [
  'Too many redemptions at once',
  'Giving away products without enough return',
  'Customers redeeming without making an additional purchase',
  'Adding extra work for staff or slowing down service',
  'Rewards being misused or shared outside the program',
  'Not knowing whether it brings back repeat customers',
  'Not concerned',
  'Other',
];
const RESULTS_OPTIONS = [
  'New customers discovering our café',
  'More visits during slower periods',
  'More repeat customers',
  'Higher customer spending',
  'More local visibility and exposure',
  'Insights into customer behaviour and performance',
  'Measurable marketing results',
  'Other',
];
const WILLINGNESS_OPTIONS = [
  'Very open to it',
  'Open to testing it',
  'Want to understand redemption limits first',
  'Want to know the type of customer it brings',
  'Concerned about the cost',
  'Not sure yet',
];
// Price bands, not a single number — asking "would you pay $59?" anchors
// the answer to that figure instead of revealing real willingness to pay.
// Framed around what the subscription actually is (new-customer discovery
// and marketing, rewards included) so a low answer here means the pitch
// itself needs work, not just the number.
const PRICE_BAND_OPTIONS = [
  'Only if it stays free',
  '$1–25/month',
  '$26–50/month',
  '$51–75/month',
  '$76–100/month',
  'More than $100/month, if the results are there',
  'Not sure without trying it first',
];

const STEP_TITLES = [
  'Who you are',
  "When you're slow",
  'What would you offer as a City Card reward? (Choose up to 2)',
  'What concerns would you have about offering a Brew and the City reward? (Choose up to 3)',
  'What results would you want from Brew and the City? (Choose up to 3)',
  'Willingness',
  "What it's worth to you",
];
const LAST_STEP = STEP_TITLES.length - 1;

// §13.6.1 — the café-side validation survey. Was one scrolling page with
// labelled sections (simpler to build and verify, per the original note
// here); moved to a step-per-question wizard on request (see chat).
// Everything's still one <form> and one submit — only the step gate and
// the Next/Back buttons are new, not a separate flow per step.
export function CafePartnerSurveyForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');

  const [cafeName, setCafeName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [instagramOrWebsite, setInstagramOrWebsite] = useState('');
  const [locationCount, setLocationCount] = useState('');
  const [slowerDays, setSlowerDays] = useState<string[]>([]);
  const [slowerParts, setSlowerParts] = useState<string[]>([]);
  const [offerTypes, setOfferTypes] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [resultsThatMatter, setResultsThatMatter] = useState<string[]>([]);
  const [willingness, setWillingness] = useState('');
  const [priceExpectation, setPriceExpectation] = useState('');
  const [freeText, setFreeText] = useState('');

  // Only step 0 has required fields — everything past it was always
  // optional, so Next just advances freely there.
  function goNext() {
    if (step === 0) {
      if (!cafeName.trim()) {
        setStepError('Café name is required.');
        return;
      }
      if (!EMAIL_RE.test(email.trim())) {
        setStepError('A valid email is required.');
        return;
      }
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
    if (!cafeName.trim() || !EMAIL_RE.test(email.trim())) return;

    const payload = {
      cafeName: cafeName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      cityArea: cityArea.trim(),
      instagramOrWebsite: instagramOrWebsite.trim(),
      locationCount,
      slowerDays,
      slowerParts,
      offerTypes,
      concerns,
      resultsThatMatter,
      willingness,
      priceExpectation,
      freeText: freeText.trim(),
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
      setMessage(`Thanks — we've got ${payload.cafeName}. Watch ${payload.email} for a note from us.`);
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
      // Off-white, not the shared class's default --paper-2 (a slightly
      // darker cream) — scoped here rather than changing the shared
      // .cafe-signup-form class, since ConsumerSurveyForm uses that same
      // class and wasn't part of this request.
      style={{ maxWidth: 640, background: '#faf8f4' }}
    >
      <SurveyProgress step={step} total={STEP_TITLES.length} />
      <div className="label" style={{ margin: '10px 0' }}>
        {step + 1}. {STEP_TITLES[step]}
      </div>

      {step === 0 ? (
        <>
          <div className="field-row">
            <div>
              <label htmlFor="cafeName">Café name</label>
              <input type="text" id="cafeName" name="cafeName" autoComplete="organization" value={cafeName} onChange={(e) => setCafeName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="contactName">Contact name</label>
              <input type="text" id="contactName" name="contactName" autoComplete="name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="cityArea">City / area</label>
              <input type="text" id="cityArea" name="cityArea" autoComplete="address-level2" placeholder="e.g. Beltline, Calgary" value={cityArea} onChange={(e) => setCityArea(e.target.value)} />
            </div>
          </div>
          <div className="field-row" style={{ marginBottom: 16 }}>
            <div>
              <label htmlFor="instagramOrWebsite">Instagram or website</label>
              <input
                type="text"
                id="instagramOrWebsite"
                name="instagramOrWebsite"
                autoComplete="url"
                placeholder="@yourcafe"
                value={instagramOrWebsite}
                onChange={(e) => setInstagramOrWebsite(e.target.value)}
              />
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
        </>
      ) : null}

      {step === 1 ? (
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
      ) : null}

      {step === 2 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <SurveyMultiSelect name="offerTypes" options={OFFER_OPTIONS} selected={offerTypes} onChange={setOfferTypes} max={2} />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <SurveyMultiSelect name="concerns" options={CONCERN_OPTIONS} selected={concerns} onChange={setConcerns} max={3} />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <SurveyMultiSelect name="resultsThatMatter" options={RESULTS_OPTIONS} selected={resultsThatMatter} onChange={setResultsThatMatter} max={3} />
        </div>
      ) : null}

      {step === 5 ? (
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
          <textarea id="freeText" name="freeText" rows={3} style={{ width: '100%' }} value={freeText} onChange={(e) => setFreeText(e.target.value)} />
        </div>
      ) : null}

      {step === 6 ? (
        <div className="ratio-box" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, marginBottom: 8 }}>
            For a subscription that brings you new, taste-matched customers on an ongoing basis — with the shared
            rewards network included — what would you expect to pay monthly?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRICE_BAND_OPTIONS.map((option) => (
              <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
                <input
                  type="radio"
                  name="priceExpectation"
                  value={option}
                  checked={priceExpectation === option}
                  onChange={() => setPriceExpectation(option)}
                  style={{ width: 'auto' }}
                />
                {option}
              </label>
            ))}
          </div>
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
