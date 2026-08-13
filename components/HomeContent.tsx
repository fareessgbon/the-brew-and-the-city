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
// to be in. A few real seeded cafés (Parkhill, Springbank Hill, Varsity NW)
// sit outside this list entirely — they're real Calgary businesses, just
// not part of the initial walkable cohort this list is telling the story
// of. If that set grows, update this list deliberately rather than
// deriving it from whatever's in the database that day, so the homepage
// never silently claims a wider cohort than what's actually been curated.
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
            {/* "Try the quiz below — it's real" used to end this paragraph.
                It was written to mean "this isn't a mockup, the matching
                engine underneath genuinely runs" — but read cold, on a site
                for a product that hasn't launched, it says "the finished
                app is live here", which it isn't. The quiz is framed as
                what it is instead: a working preview. */}
            <p className="lede">
              Coffee, matcha, tea — every good café in Calgary will be in here. Google ranks them by review count. We
              match you to yours — your café, not just the highest-rated café. The quiz below is a working preview of
              that matching; Brew itself is still pre-launch, and the waitlist is how you get in first.
            </p>
            <div className="cta-row">
              <Link href="#waitlist" className="btn btn-primary">
                Join the waitlist
              </Link>
              <Link href="#how" className="btn btn-ghost">
                See how matching will work
              </Link>
              <Link href="/for-cafes" className="btn btn-ghost">
                For cafés: partner with us
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
          <div className="section-eyebrow label">Calgary&apos;s scene · built cluster by cluster</div>
          {/* Deliberately says nothing about what cafés pay. The founding-
              partner offer is a pitch to café owners and it lives on
              /for-cafes, which is the page written for them; on the consumer
              homepage it just puts the reader on the wrong side of the
              product. Same section, framed around what a visitor gets. */}
          <h2 className="section-title">
            Real neighbourhoods, seeded one café at a time.
          </h2>
          <p className="section-lede">
            Every café shown here is a real Calgary business; taste profiles are placeholders until launch.
            We&apos;re building Calgary out cluster by cluster, so the map fills in the way people actually drink
            coffee — by neighbourhood, not by whoever ranks highest.
          </p>
          <div className="cafes-strip">
            {coreNeighbourhoods.map((area) => (
              <div className="cafe-chip" key={area}>
                {area}
              </div>
            ))}
          </div>
          <Link href="/for-cafes" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 24 }}>
            See partner details →
          </Link>
        </div>
      </section>

      <section id="sixth-round">
        <div className="wrap club-band">
          {/* "Your free item is on us" read as Brew buying the drink. It
              doesn't: the reward is redeemed at, and given by, the
              participating café. Saying so costs nothing — the offer is
              just as good — and it's the difference between a promise we
              keep and one a café is surprised to be holding. */}
          <div className="section-eyebrow label">The City Card · At launch, free for you</div>
          <h2>Five visits. The next one&apos;s free, from a partner café.</h2>
          <div className="club-grid">
            <div>
              <ul className="club-list">
                <li>One personal card, automatic when you join at launch — not tied to any one café</li>
                <li>
                  One drink purchased at any partner café earns a qualifying visit — five of them unlock the reward
                </li>
                <li>Max 2 visits from the same café per card, so a completed card always touches at least 3 different spots</li>
                <li>The card itself costs you nothing — no subscription, no fee, ever</li>
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
                5 qualifying visits unlock a free item, given by the participating café you redeem at — subject to
                what they offer and have available. Max 2 visits per café, so it&apos;s always at least 3 spots.
              </div>
              {sixthRoundLine ? <div className="maps-test-line" style={{ marginTop: 12 }}>{sixthRoundLine}</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section id="waitlist">
        <div className="wrap">
          <div className="signup-band">
            {/* Was "Save your Taste" / "Keep the matches you just saw" —
                which the waitlist doesn't do. It stores an email, a first
                name and your go-to cafés; the quiz result lives in React
                state and is gone on reload. Promising to keep something we
                throw away is the one kind of copy that gets found out on
                day one of launch. */}
            <div className="section-eyebrow label">Be first in Calgary</div>
            <h2>Join the list. Be first to try Brew in Calgary.</h2>
            <p className="section-lede">
              We&apos;re building Brew and the City with café lovers. Join us at launch.
            </p>
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}
