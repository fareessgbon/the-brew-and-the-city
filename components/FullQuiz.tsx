'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FULL_QUIZ, tasteOptionsFor, type QuizQuestion } from '@/lib/data/full-quiz';
import { NEUTRAL_VECTOR, clampDim, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';
import { readQuizProgress, clearQuizProgress } from '@/lib/quizProgress';
import { memberFetch } from '@/lib/client/memberFetch';

const TASTE_DIMS = FULL_QUIZ.filter((q) => q.kind === 'taste').map((q) => (q as { dim: Dim }).dim);

interface Requirements {
  needsNonDairy: boolean;
  needsGlutenFree: boolean;
  needsWheelchair: boolean;
}

export function FullQuiz() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [vector, setVector] = useState<TasteVector>(NEUTRAL_VECTOR);
  const [resumedDims, setResumedDims] = useState<Dim[]>([]);
  const [category, setCategory] = useState<PrimaryDrinkCategory | null>(null);
  const [resumedCategory, setResumedCategory] = useState(false);
  const [step, setStep] = useState(0);
  const [radiusKm, setRadiusKm] = useState(12);
  const [worthTrip, setWorthTrip] = useState(false);
  const [phase, setPhase] = useState<'quiz' | 'requirements'>('quiz');
  const [requirements, setRequirements] = useState<Requirements>({ needsNonDairy: false, needsGlutenFree: false, needsWheelchair: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The homepage teaser may have already answered some of these — resume
  // from there instead of asking again. Only decided client-side
  // (localStorage doesn't exist during SSR), so nothing renders until this
  // has had a chance to run, avoiding a flash of the wrong first question.
  useEffect(() => {
    const stored = readQuizProgress();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe, client-only localStorage read; gated by `ready` below.
      setVector((prev) => ({ ...prev, ...stored.vector }));
      setResumedDims(stored.answeredDims);
      if (stored.primaryDrinkCategory) {
        setCategory(stored.primaryDrinkCategory);
        setResumedCategory(true);
      }
      clearQuizProgress();
    }
    setReady(true);
  }, []);

  const questions = useMemo<QuizQuestion[]>(
    () =>
      FULL_QUIZ.filter((q) => {
        if (q.kind === 'category') return !resumedCategory;
        if (q.kind === 'taste') return !resumedDims.includes(q.dim);
        return true;
      }),
    [resumedDims, resumedCategory],
  );

  const question = questions[step];

  async function finish(finalVector: TasteVector, finalRadius: number, finalWorthTrip: boolean, finalRequirements: Requirements) {
    setSaving(true);
    setError('');
    try {
      const res = await memberFetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: finalVector,
          answeredDims: TASTE_DIMS,
          radiusKm: finalRadius,
          worthTrip: finalWorthTrip,
          primaryDrinkCategory: category,
          needsNonDairy: finalRequirements.needsNonDairy,
          needsGlutenFree: finalRequirements.needsGlutenFree,
          needsWheelchair: finalRequirements.needsWheelchair,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your Type.');
      router.push('/onboarding/location');
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function advanceOrRequirements() {
    if (step + 1 < questions.length) {
      setStep((s) => s + 1);
    } else {
      setPhase('requirements');
    }
  }

  function chooseCategory(value: PrimaryDrinkCategory) {
    setCategory(value);
    advanceOrRequirements();
  }

  function chooseTasteOption(dim: Dim, delta: number) {
    const nextVector = { ...vector, [dim]: clampDim(vector[dim] + delta) };
    setVector(nextVector);
    advanceOrRequirements();
  }

  function chooseRadiusOption(km: number, trip: boolean) {
    setRadiusKm(km);
    setWorthTrip(trip);
    advanceOrRequirements();
  }

  function toggleRequirement(key: keyof Requirements) {
    setRequirements((prev) => ({ needsNonDairy: false, needsGlutenFree: false, needsWheelchair: false, [key]: !prev[key] }));
  }

  function finishRequirements() {
    finish(vector, radiusKm, worthTrip, requirements);
  }

  if (!ready) {
    return <div className="quiz-card" style={{ maxWidth: 560, margin: '0 auto', minHeight: 300 }} />;
  }

  if (phase === 'requirements') {
    const noneSelected = !requirements.needsNonDairy && !requirements.needsGlutenFree && !requirements.needsWheelchair;
    return (
      <div className="quiz-card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="quiz-step active">
          <div className="quiz-q">Anything we should filter out?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5 }}>
              <input type="checkbox" checked={requirements.needsNonDairy} onChange={() => toggleRequirement('needsNonDairy')} style={{ width: 'auto' }} />
              I need non-dairy options
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5 }}>
              <input type="checkbox" checked={requirements.needsGlutenFree} onChange={() => toggleRequirement('needsGlutenFree')} style={{ width: 'auto' }} />
              Gluten-free
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5 }}>
              <input type="checkbox" checked={requirements.needsWheelchair} onChange={() => toggleRequirement('needsWheelchair')} style={{ width: 'auto' }} />
              Step-free access
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, color: 'var(--whisk)' }}>
              <input type="checkbox" checked={noneSelected} onChange={() => setRequirements({ needsNonDairy: false, needsGlutenFree: false, needsWheelchair: false })} style={{ width: 'auto' }} />
              None of these
            </label>
          </div>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={finishRequirements} style={{ padding: '10px 20px', fontSize: 13 }}>
            {saving ? 'Saving…' : 'Finish'}
          </button>
          {error ? <div className="match-disclaimer" style={{ color: 'var(--error, #A8503F)' }}>{error}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="quiz-step active">
        <div className="quiz-q">{question.question}</div>
        <div className="pair">
          {question.kind === 'category'
            ? question.options.map((opt) => (
                <button key={opt.label} type="button" className="opt" disabled={saving} onClick={() => chooseCategory(opt.value)}>
                  {opt.label}
                  {opt.sub ? <span className="sub">{opt.sub}</span> : null}
                </button>
              ))
            : question.kind === 'taste'
              ? tasteOptionsFor(question, category).map((opt) => (
                  <button key={opt.label} type="button" className="opt" disabled={saving} onClick={() => chooseTasteOption(question.dim, opt.delta)}>
                    {opt.label}
                    {opt.sub ? <span className="sub">{opt.sub}</span> : null}
                  </button>
                ))
              : question.options.map((opt) => (
                  <button key={opt.label} type="button" className="opt" disabled={saving} onClick={() => chooseRadiusOption(opt.radiusKm, opt.worthTrip)}>
                    {opt.label}
                    {opt.sub ? <span className="sub">{opt.sub}</span> : null}
                  </button>
                ))}
        </div>
        <div className="quiz-progress">
          QUESTION {step + 1} OF {questions.length}
          {resumedDims.length > 0 || resumedCategory ? ` — ${resumedDims.length + (resumedCategory ? 1 : 0)} already answered on the homepage` : ''}
        </div>
        {error ? <div className="match-disclaimer" style={{ color: 'var(--error, #A8503F)' }}>{error}</div> : null}
      </div>
    </div>
  );
}
