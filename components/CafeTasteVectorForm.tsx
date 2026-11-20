'use client';

import { useState, type FormEvent } from 'react';
import { CITIES, NEIGHBOURHOOD_SUGGESTIONS_BY_CITY, PRIMARY_DRINK_CATEGORIES, PRIMARY_DRINK_CATEGORY_LABELS, type Dim, type PriceBand } from '@/lib/data/cafeFields';

// This survey is public and doesn't ask which city a café is in, so the
// datalist just offers every known neighbourhood across both markets —
// unlike the admin editor, which can narrow by the city it already knows.
const ALL_NEIGHBOURHOOD_SUGGESTIONS = CITIES.flatMap((c) => NEIGHBOURHOOD_SUGGESTIONS_BY_CITY[c]);
import { TASTE_SURVEY_QUESTIONS } from '@/lib/data/cafeTasteVectorSurvey';
import { SurveyMultiSelect } from './SurveyMultiSelect';
import { SurveySingleSelect } from './SurveySingleSelect';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One scrolling page with labelled sections, not a step wizard — same
// starting choice the café-partner survey itself made before it grew a
// wizard on request (see that form's own comment). Nothing here has asked
// for one yet, and nine questions in labelled blocks reads fine as a
// single page.
export function CafeTasteVectorForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const [cafeName, setCafeName] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [instagramOrWebsite, setInstagramOrWebsite] = useState('');
  const [drinkCategories, setDrinkCategories] = useState<string[]>([]);
  const [scores, setScores] = useState<Partial<Record<Dim, number>>>({});
  const [priceBand, setPriceBand] = useState<PriceBand | null>(null);
  const [freeText, setFreeText] = useState('');

  function chooseScore(dim: Dim, score: number, band?: PriceBand) {
    setScores((prev) => ({ ...prev, [dim]: score }));
    if (band) setPriceBand(band);
  }

  const allTasteAnswered = TASTE_SURVEY_QUESTIONS.every((q) => scores[q.dim] !== undefined);
  const canSubmit =
    cafeName.trim().length > 0 &&
    neighbourhood.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    drinkCategories.length > 0 &&
    allTasteAnswered;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || status === 'sending') return;
    setStatus('sending');
    setMessage('');

    const answers = {
      cafeName: cafeName.trim(),
      neighbourhood: neighbourhood.trim(),
      contactName: contactName.trim(),
      email: email.trim().toLowerCase(),
      instagramOrWebsite: instagramOrWebsite.trim(),
      drinkCategories,
      drink_score: scores.drink,
      energy_score: scores.energy,
      aesthetic_score: scores.aesthetic,
      pace_score: scores.pace,
      adventure_score: scores.adventure,
      price_score: scores.price,
      food_score: scores.food,
      price_band: priceBand,
      freeText: freeText.trim(),
    };

    try {
      const res = await fetch('/api/surveys/cafe-taste-vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof body.error === 'string' ? body.error : 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setMessage('Couldn’t reach the server. Check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="cafe-form-success">
        {`Thank you — ${cafeName} is in. We'll follow up if we have questions, and you'll hear from us before anything about your café goes live.`}
      </div>
    );
  }

  return (
    <form className="cafe-signup-form cafe-editor" onSubmit={handleSubmit}>
      <section className="cafe-editor-block">
        <h2>Your café</h2>
        <div className="field-row">
          <div className="cafe-field">
            <label htmlFor="tv-cafe-name">Café name</label>
            <input id="tv-cafe-name" value={cafeName} onChange={(e) => setCafeName(e.target.value)} placeholder="Monogram" required />
          </div>
          <div className="cafe-field">
            <label htmlFor="tv-neighbourhood">Neighbourhood</label>
            <input
              id="tv-neighbourhood"
              list="tv-neighbourhoods"
              value={neighbourhood}
              onChange={(e) => setNeighbourhood(e.target.value)}
              placeholder="Mission"
              required
            />
            <datalist id="tv-neighbourhoods">
              {ALL_NEIGHBOURHOOD_SUGGESTIONS.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="field-row">
          <div className="cafe-field">
            <label htmlFor="tv-contact-name">Your name</label>
            <input id="tv-contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="cafe-field">
            <label htmlFor="tv-email">Email</label>
            <input id="tv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourcafe.com" required />
          </div>
        </div>
        <div className="field-row">
          <div className="cafe-field">
            <label htmlFor="tv-instagram">Instagram or website</label>
            <input id="tv-instagram" value={instagramOrWebsite} onChange={(e) => setInstagramOrWebsite(e.target.value)} placeholder="Optional" />
          </div>
        </div>
      </section>

      <fieldset className="cafe-editor-block cafe-fieldset">
        <legend>What do you serve?</legend>
        <SurveyMultiSelect
          name="drinkCategories"
          options={PRIMARY_DRINK_CATEGORIES.map((c) => PRIMARY_DRINK_CATEGORY_LABELS[c])}
          selected={drinkCategories.map((c) => PRIMARY_DRINK_CATEGORY_LABELS[c as keyof typeof PRIMARY_DRINK_CATEGORY_LABELS])}
          onChange={(labels) =>
            setDrinkCategories(
              PRIMARY_DRINK_CATEGORIES.filter((c) => labels.includes(PRIMARY_DRINK_CATEGORY_LABELS[c])),
            )
          }
        />
      </fieldset>

      {TASTE_SURVEY_QUESTIONS.map((q) => (
        <fieldset key={q.dim} className="cafe-editor-block cafe-fieldset">
          <legend>{q.question}</legend>
          <SurveySingleSelect
            name={q.dim}
            options={q.options.map((o) => ({ label: o.label, value: String(o.score) }))}
            value={scores[q.dim] !== undefined ? String(scores[q.dim]) : null}
            onChange={(value) => {
              const option = q.options.find((o) => o.score === Number(value));
              chooseScore(q.dim, Number(value), option?.priceBand);
            }}
          />
        </fieldset>
      ))}

      <section className="cafe-editor-block">
        <h2>Anything else?</h2>
        <div className="cafe-field">
          <label htmlFor="tv-free-text">Optional — anything about your café we should know</label>
          <textarea id="tv-free-text" value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={3} />
        </div>
      </section>

      {message ? (
        <p className="cafe-editor-error" role="alert">
          {message}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={!canSubmit || status === 'sending'} style={{ width: 'auto' }}>
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>
      <p className="cafe-form-note">
        This isn&apos;t an application and doesn&apos;t sign your café up for anything — it&apos;s how your café gets
        listed accurately instead of guessed at from the outside.
      </p>
    </form>
  );
}
