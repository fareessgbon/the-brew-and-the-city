'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HERO_QUIZ, tasteOptionsFor } from '@/lib/data/quiz';
import { type ContextKey, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';
import { mapsTestLine } from '@/lib/mapsTestLine';
import { scoreCafes } from '@/lib/scoreCafes';
import { ProximityMap } from '@/components/ProximityMap';
import { useCity } from '@/components/CityProvider';
import { track } from '@/lib/analytics';
import { CITIES, CITY_LABELS, type City } from '@/lib/data/cafeFields';

// The homepage teaser's café list — fetched from Supabase (see app/page.tsx)
// rather than hardcoded, so the anonymous pre-signup demo already reflects
// real seeded cafés and their real taste vectors.
export interface HeroCafe {
  id: string;
  name: string;
  slug: string;
  area: string;
  city: City;
  vector: TasteVector;
}

interface HeroQuizProps {
  cafes: readonly HeroCafe[];
  userVector: TasteVector;
  answeredDims: readonly Dim[];
  primaryDrinkCategory: PrimaryDrinkCategory | null;
  /** What the visitor said they're here for — null until that question is
   * answered, same "don't score what wasn't asked" rule contextFit() itself
   * follows (see lib/matching/context-fit.ts). */
  context: ContextKey | null;
  onAnswer: (dim: Dim, delta: number) => void;
  onCategory: (category: PrimaryDrinkCategory) => void;
  onContext: (context: ContextKey) => void;
  onRetake: () => void;
}

export function HeroQuiz({ cafes, userVector, answeredDims, primaryDrinkCategory, context, onAnswer, onCategory, onContext, onRetake }: HeroQuizProps) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'question' | 'results'>('question');
  const [trustLine, setTrustLine] = useState('');
  // The city is the site-wide one (see CityProvider) — asked here only if
  // the visitor skipped the welcome prompt. Matches are scoped to it.
  const { city, setCity } = useCity();
  // Whether the "which city" step is part of THIS run — fixed at mount, not
  // reactive to city changing later, so the numbering below can't shift
  // mid-quiz. Most visitors reach the quiz with a city already set (the
  // homepage banner/header switcher, or a remembered choice), in which case
  // this step never renders and shouldn't be counted as "question 1" — the
  // bug this fixes had every real question numbered one ahead of itself
  // (and the total one too high) whenever that was the case.
  const [cityStepShown] = useState(() => city === null);
  const currentQuestion = HERO_QUIZ[step];
  const totalQuestions = HERO_QUIZ.length + (cityStepShown ? 1 : 0);
  const questionOffset = cityStepShown ? 2 : 1;
  const cityCafes = useMemo(() => (city ? cafes.filter((c) => c.city === city) : cafes), [cafes, city]);

  // distanceMetres stays null inside scoreCafes — no café in this build has
  // real coordinates yet (step 10's geocoding), so proximity honestly drops
  // out of the blend rather than being scored against a fake distance.
  const scored = useMemo(
    () => scoreCafes(cityCafes, userVector, answeredDims, context),
    [cityCafes, userVector, answeredDims, context],
  );

  const top3 = scored.slice(0, 3);
  const top3Ids = useMemo(() => new Set(top3.map((c) => c.id)), [top3]);

  // Trust line is set once when results first appear, not on every re-score
  // (e.g. after a signup-time café blend) — it's a one-time reassurance, not
  // something that should reset or re-trigger the localStorage view-counter.
  useEffect(() => {
    if (phase === 'results' && !trustLine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage view-counter read.
      setTrustLine(mapsTestLine('top3', 'Three, not thirty. Ranked by what you told us, not by review count.'));
    }
  }, [phase, trustLine]);

  function advance() {
    if (step === 0) track('quiz_started', { city: city ?? undefined });
    if (step + 1 < HERO_QUIZ.length) {
      setStep((s) => s + 1);
    } else {
      setPhase('results');
      track('quiz_completed', { city: city ?? undefined });
    }
  }

  function chooseCategory(value: PrimaryDrinkCategory) {
    onCategory(value);
    advance();
  }

  function chooseContext(value: ContextKey) {
    onContext(value);
    advance();
  }

  function chooseTasteOption(dim: Dim, delta: number) {
    onAnswer(dim, delta);
    advance();
  }

  function retake() {
    onRetake();
    setStep(0);
    setPhase('question');
    setTrustLine('');
  }

  return (
    <div className="quiz-card" id="quizCard">
      {phase === 'question' && city === null && (
        <div className="quiz-step active">
          <div className="quiz-q">Which city are you in?</div>
          <div className="pair">
            {CITIES.map((c) => (
              <button key={c} type="button" className="opt" onClick={() => setCity(c)}>
                {CITY_LABELS[c]}
              </button>
            ))}
          </div>
          <div className="quiz-progress">
            QUESTION 1 OF {totalQuestions}
          </div>
        </div>
      )}

      {phase === 'question' && city !== null && currentQuestion.kind === 'category' && (
        <div className="quiz-step active">
          <div className="quiz-q">{currentQuestion.question}</div>
          <div className="pair">
            {currentQuestion.options.map((opt) => (
              <button key={opt.label} type="button" className="opt" onClick={() => chooseCategory(opt.value)}>
                {opt.label}
                {opt.sub ? <span className="sub">{opt.sub}</span> : null}
              </button>
            ))}
          </div>
          <div className="quiz-progress">
            QUESTION {step + questionOffset} OF {totalQuestions}
          </div>
        </div>
      )}

      {phase === 'question' && city !== null && currentQuestion.kind === 'taste' && (
        <div className="quiz-step active">
          <div className="quiz-q">{currentQuestion.question}</div>
          <div className="pair">
            {tasteOptionsFor(currentQuestion, primaryDrinkCategory).map((opt) => (
              <button key={opt.label} type="button" className="opt" onClick={() => chooseTasteOption(currentQuestion.dim, opt.delta)}>
                {opt.label}
                {opt.sub ? <span className="sub">{opt.sub}</span> : null}
              </button>
            ))}
          </div>
          <div className="quiz-progress">
            QUESTION {step + questionOffset} OF {totalQuestions}
          </div>
        </div>
      )}

      {phase === 'question' && city !== null && currentQuestion.kind === 'context' && (
        <div className="quiz-step active">
          <div className="quiz-q">{currentQuestion.question}</div>
          <div className="pair">
            {currentQuestion.options.map((opt) => (
              <button key={opt.label} type="button" className="opt" onClick={() => chooseContext(opt.value)}>
                {opt.label}
                {opt.sub ? <span className="sub">{opt.sub}</span> : null}
              </button>
            ))}
          </div>
          <div className="quiz-progress">
            QUESTION {step + questionOffset} OF {totalQuestions}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="map-reveal">
          <h3>{city ? `Your top 3 in ${CITY_LABELS[city]}` : 'Your top 3'}</h3>
          <div className="quiz-preview-badge">Preview · sample cafés</div>

          <div id="matchResults">
            {top3.map((c, i) => (
              <div className="match-result" key={c.id}>
                <div className="rank">#{i + 1}</div>
                <div className="body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="name">
                      {c.name} <span style={{ fontWeight: 400, color: 'var(--whisk)', fontSize: 13 }}>— {c.area}</span>
                    </span>
                    <span className="pct" aria-label={`${c.pct} percent match`}>
                      {c.pct}% match
                    </span>
                  </div>
                  <div className="why">{c.reasons.join(' ')}</div>
                </div>
              </div>
            ))}
          </div>


          <details className="map-details">
            <summary>See why — where you sit in taste-space</summary>
            <ProximityMap
            cafes={scored.map((c) => ({ id: c.id, name: c.name, vector: c.vector, highlight: top3Ids.has(c.id) }))}
            you={userVector}
            showLabelsFor={top3Ids}
          />

          </details>

          <div className="match-disclaimer">
            A preview, not live recommendations — flavour alone, against placeholder café data.
          </div>
          {trustLine ? <div className="maps-test-line">{trustLine}</div> : null}

          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Was "be first to see all 60", which reads as a promise that
                60 finished café profiles are sitting behind a signup wall.
                They aren't — there are 60+ independent cafés in Calgary,
                which is the ambition, not the current catalogue. */}
            <Link href="#waitlist" className="btn btn-primary">
              Join the waitlist — be first when Brew launches →
            </Link>
          </div>
          <button type="button" className="restart-link" onClick={retake}>
            Retake the quiz
          </button>
        </div>
      )}
    </div>
  );
}
