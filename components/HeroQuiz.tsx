'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { HERO_QUIZ, tasteOptionsFor } from '@/lib/data/quiz';
import { tasteFit, tasteReason, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';
import { mapsTestLine } from '@/lib/mapsTestLine';
import { track } from '@/lib/analytics';

// The homepage teaser's café list — fetched from Supabase (see app/page.tsx)
// rather than hardcoded, so the anonymous pre-signup demo already reflects
// real seeded cafés and their real taste vectors.
export interface HeroCafe {
  id: string;
  name: string;
  slug: string;
  area: string;
  vector: TasteVector;
}

function project(v: TasteVector) {
  const x = v.drink;
  const y = 0.6 * v.energy + 0.4 * (100 - v.pace);
  return { x, y };
}

function toPct(v: number) {
  return Math.max(4, Math.min(96, v));
}

interface ScoredCafe extends HeroCafe {
  pct: number;
  point: { x: number; y: number };
}

interface HeroQuizProps {
  cafes: readonly HeroCafe[];
  userVector: TasteVector;
  answeredDims: readonly Dim[];
  primaryDrinkCategory: PrimaryDrinkCategory | null;
  onAnswer: (dim: Dim, delta: number) => void;
  onCategory: (category: PrimaryDrinkCategory) => void;
  onRetake: () => void;
}

export function HeroQuiz({ cafes, userVector, answeredDims, primaryDrinkCategory, onAnswer, onCategory, onRetake }: HeroQuizProps) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'question' | 'results'>('question');
  const [dotsVisible, setDotsVisible] = useState(false);
  const [trustLine, setTrustLine] = useState('');
  const currentQuestion = HERO_QUIZ[step];

  const scored = useMemo<ScoredCafe[]>(() => {
    return cafes.map((c) => {
      const tf = tasteFit(userVector, c.vector, answeredDims);
      const pct = Math.max(40, Math.min(98, Math.round(tf)));
      return { ...c, pct, point: project(c.vector) };
    }).sort((a, b) => b.pct - a.pct);
  }, [cafes, userVector, answeredDims]);

  const top3 = scored.slice(0, 3);
  const top3Ids = useMemo(() => new Set(top3.map((c) => c.id)), [top3]);
  const you = useMemo(() => project(userVector), [userVector]);

  useEffect(() => {
    if (phase !== 'results') return;
    setDotsVisible(false);
    const raf = requestAnimationFrame(() => setDotsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Trust line is set once when results first appear, not on every re-score
  // (e.g. after a signup-time café blend) — it's a one-time reassurance, not
  // something that should reset or re-trigger the localStorage view-counter.
  useEffect(() => {
    if (phase === 'results' && !trustLine) {
      setTrustLine(mapsTestLine('top3', 'Three, not thirty. Ranked by what you told us, not by review count.'));
    }
  }, [phase, trustLine]);

  function advance() {
    if (step + 1 < HERO_QUIZ.length) {
      setStep((s) => s + 1);
    } else {
      setPhase('results');
      track('hero_quiz_completed');
    }
  }

  function chooseCategory(value: PrimaryDrinkCategory) {
    onCategory(value);
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
    setDotsVisible(false);
    setTrustLine('');
  }

  return (
    <div className="quiz-card" id="quizCard">
      {phase === 'question' && currentQuestion.kind === 'category' && (
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
            QUESTION {step + 1} OF {HERO_QUIZ.length}
          </div>
        </div>
      )}

      {phase === 'question' && currentQuestion.kind === 'taste' && (
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
            QUESTION {step + 1} OF {HERO_QUIZ.length}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="map-reveal">
          <h3>Where you sit in taste-space</h3>
          <div className="pmap" aria-hidden="true">
            <div className="axis-label" style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }}>
              bold &amp; unsweetened
            </div>
            <div className="axis-label" style={{ bottom: 4, left: '50%', transform: 'translateX(-50%)' }}>
              sweet &amp; milky
            </div>
            <div
              className="axis-label"
              style={{ left: 6, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'left center' }}
            >
              quiet
            </div>
            <div className="axis-label" style={{ right: 6, top: '50%', transform: 'translateY(-50%)' }}>
              loud
            </div>
            <div className="cross-h" />
            <div className="cross-v" />

            {scored.map((c, i) => (
              <div
                key={c.id}
                className={`pdot cafe${top3Ids.has(c.id) ? ' high' : ''}${dotsVisible ? ' visible' : ''}`}
                style={{
                  left: `${toPct(c.point.x)}%`,
                  top: `${toPct(100 - c.point.y)}%`,
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            ))}
            {top3.map((c) => (
              <div
                key={`${c.id}-label`}
                className={`pdot-label${dotsVisible ? ' visible' : ''}`}
                style={{ left: `${toPct(c.point.x)}%`, top: `${toPct(100 - c.point.y)}%` }}
              >
                {c.name}
              </div>
            ))}

            <div
              className={`pdot you${dotsVisible ? ' visible' : ''}`}
              style={{ left: `${toPct(you.x)}%`, top: `${toPct(100 - you.y)}%`, zIndex: 5 }}
            />
            <div
              className={`pdot-label${dotsVisible ? ' visible' : ''}`}
              style={{ left: `${toPct(you.x)}%`, top: `${toPct(100 - you.y)}%` }}
            >
              You
            </div>
          </div>

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
                  <div className="why">{tasteReason(userVector, c.vector, answeredDims)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="match-disclaimer">
            Based on flavour alone — sign up and the full app adds what you need and how far you&apos;ll go.
          </div>
          {trustLine ? <div className="maps-test-line">{trustLine}</div> : null}

          <div style={{ marginTop: 16 }}>
            <Link href="#signup" className="btn btn-primary">
              Sign up free — see all 60 →
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
