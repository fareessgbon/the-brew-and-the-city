'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NEUTRAL_VECTOR, clampDim, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';
import { mapsTestLine } from '@/lib/mapsTestLine';
import { HeroQuiz, type HeroCafe } from '@/components/HeroQuiz';
import { WaitlistForm } from '@/components/WaitlistForm';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { BeanMascot } from '@/components/BeanMascot';
import { HeroFeatureList } from '@/components/HeroFeatureList';

const ANSWERED_DIMS: Dim[] = ['drink', 'energy'];

// The strip shows the walkable core, once each — not one chip per café
// (17 chips with heavy repeats) and not every neighbourhood a café happens
// to be in (a few, like Parkhill or Springbank Hill, are real but outside
// the six-cluster story the copy above tells). Order is deliberate, not
// alphabetical.
const CORE_NEIGHBOURHOODS = [
  'Beltline',
  'Downtown',
  'Inglewood',
  'Bridgeland',
  'Chinatown',
  'Mission',
  'Kensington',
  'Crescent Heights',
];

// The real, interactive quiz + matching engine, restored for the pre-launch
// homepage so visitors get a genuine idea of what the product will do —
// distinct from §0.4's own recommendation, per an explicit product
// decision (see chat). No account gets created anywhere in this flow: the
// end state is the waitlist, not a real Supabase Auth sign-up — §0.4's "no
// accounts, ever" is the one rule this build still holds to strictly.
export function HomeContent({ cafes }: { cafes: HeroCafe[] }) {
  const [userVector, setUserVector] = useState<TasteVector>(NEUTRAL_VECTOR);
  const [answeredDims, setAnsweredDims] = useState<readonly Dim[]>(ANSWERED_DIMS);
  const [primaryDrinkCategory, setPrimaryDrinkCategory] = useState<PrimaryDrinkCategory | null>(null);
  const [sixthRoundLine, setSixthRoundLine] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage view-counter read.
    setSixthRoundLine(
      mapsTestLine('sixth', 'Five visits anywhere in the network. One card, not six punch cards in your wallet.'),
    );
  }, []);

  function handleAnswer(dim: Dim, delta: number) {
    setUserVector((prev) => ({ ...prev, [dim]: clampDim(prev[dim] + delta) }));
  }

  function handleCategory(category: PrimaryDrinkCategory) {
    setPrimaryDrinkCategory(category);
  }

  function handleRetake() {
    setUserVector(NEUTRAL_VECTOR);
    setAnsweredDims(ANSWERED_DIMS);
    setPrimaryDrinkCategory(null);
  }

  const seededAreas = new Set(cafes.map((c) => c.area));
  const coreNeighbourhoods = CORE_NEIGHBOURHOODS.filter((n) => seededAreas.has(n));

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="label eyebrow">Calgary, Alberta · coming soon</div>
            <h1 className="hero-stack">
              <span className="line small">every good café,</span>
              <span className="line">MATCHED</span>
              <span className="line">TO YOUR</span>
              <span className="line">TASTE</span>
            </h1>
            <BeanMascot className="hero-mascot" />
            <p className="lede">
              Coffee, matcha, tea — every good café in Calgary will be in here. Google ranks them by review count. We
              match you to yours, the way taste, not a star rating, actually works. Try the quiz below — it&apos;s
              real.
            </p>
            <div className="cta-row">
              <Link href="#waitlist" className="btn btn-primary">
                Join the waitlist
              </Link>
              <Link href="#how" className="btn btn-ghost">
                See how matching works
              </Link>
            </div>
          </div>

          <div className="hero-secondary">
            <HeroFeatureList />
            <HeroQuiz
              cafes={cafes}
              userVector={userVector}
              answeredDims={answeredDims}
              primaryDrinkCategory={primaryDrinkCategory}
              onAnswer={handleAnswer}
              onCategory={handleCategory}
              onRetake={handleRetake}
            />
          </div>
        </div>
      </section>

      <HowItWorksSection id="how" />

      <section id="cafeslist">
        <div className="wrap">
          <div className="section-eyebrow label">Calgary&apos;s scene · sample data for this preview</div>
          <h2 className="section-title">Seeded from the ground up, one café at a time</h2>
          <p className="section-lede">Real neighbourhoods, real cafés, placeholder taste profiles.</p>
          <div className="cafes-strip">
            {coreNeighbourhoods.map((area) => (
              <div className="cafe-chip" key={area}>
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sixth-round">
        <div className="wrap club-band">
          <div className="section-eyebrow label">The City Card · Free, always</div>
          <h2>Five visits. Your free item is on us.</h2>
          <div className="club-grid">
            <div>
              <ul className="club-list">
                <li>One personal card, automatic at signup — not tied to any one café</li>
                <li>Any drink at any partner café earns a visit — the reward is any drink on their menu</li>
                <li>Max 2 visits from the same café per card, so a completed card always touches at least 3 different spots</li>
                <li>Try for a 3rd visit somewhere you&apos;ve already used twice and we&apos;ll point you to 2 nearby cafés you haven&apos;t tried yet</li>
                <li>Partner cafés cover it, not you. No subscription, no cost to you, ever</li>
                <li>Visits expire after 90 days of inactivity; your card resets when you redeem</li>
              </ul>
              <Link href="#waitlist" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 8 }}>
                Join the waitlist
              </Link>
            </div>
            <div className="round-card">
              <div className="label">Your City Card</div>
              <div className="stamp-row">
                <div className="stamp done">1</div>
                <div className="stamp done">2</div>
                <div className="stamp done">3</div>
                <div className="stamp done">4</div>
                <div className="stamp done">5</div>
                <div className="stamp reward">Free</div>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink)', marginTop: 14 }}>
                5 visits unlocks one free item at any partner café — max 2 visits per café, so it&apos;s always at
                least 3 spots.
              </div>
              {sixthRoundLine ? <div className="maps-test-line" style={{ marginTop: 12 }}>{sixthRoundLine}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section id="cafes">
        <div className="wrap">
          <div className="forcafe-teaser">
            <div className="section-eyebrow label">For cafés · Calgary launch cohort</div>
            <h2 className="section-title">The first 15 Calgary cafés join free for six months.</h2>
            <p className="section-lede">
              We&apos;re building this before asking any café to pay for it. See the founding terms and tell us
              you&apos;re interested.
            </p>
            <Link href="/for-cafes" className="btn btn-primary">
              See partner details →
            </Link>
          </div>
        </div>
      </section>

      <section id="waitlist">
        <div className="wrap">
          <div className="signup-band">
            <div className="section-eyebrow label">Save your Taste</div>
            <h2>Join the list. Keep the matches you just saw.</h2>
            <p className="section-lede">
              This is a real preview of the matching engine, but there&apos;s no live product yet — no account, no
              password. Leave your email and we&apos;ll notify you the moment it&apos;s ready.
            </p>
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}
