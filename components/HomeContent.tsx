'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NEUTRAL_VECTOR, clampDim, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';
import { mapsTestLine } from '@/lib/mapsTestLine';
import { HeroQuiz, type HeroCafe } from '@/components/HeroQuiz';
import { SignupForm } from '@/components/SignupForm';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { useSession } from '@/components/nav/SessionProvider';

const ANSWERED_DIMS: Dim[] = ['drink', 'energy'];

export function HomeContent({ cafes }: { cafes: HeroCafe[] }) {
  const { loading, signedIn } = useSession();
  const showSignedIn = !loading && signedIn;
  const [userVector, setUserVector] = useState<TasteVector>(NEUTRAL_VECTOR);
  const [answeredDims, setAnsweredDims] = useState<readonly Dim[]>(ANSWERED_DIMS);
  const [primaryDrinkCategory, setPrimaryDrinkCategory] = useState<PrimaryDrinkCategory | null>(null);
  const [sixthRoundLine, setSixthRoundLine] = useState('');

  useEffect(() => {
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

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="label eyebrow">Calgary, Alberta · free during our launch trial</div>
            <h1>Every good café in Calgary, matched to your taste.</h1>
            <p className="lede">
              Coffee, matcha, tea — every good café in Calgary is in here. Google ranks them by review count. We
              match you to yours, the way a taste, not a star rating, actually works. Free, no subscription, ever.
            </p>
            <div className="cta-row">
              {showSignedIn ? (
                <Link href="/today" className="btn btn-primary">
                  Open App
                </Link>
              ) : (
                <Link href="#signup" className="btn btn-primary">
                  Sign up free
                </Link>
              )}
              <Link href="#how" className="btn btn-ghost">
                See how matching works
              </Link>
            </div>
          </div>

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
      </section>

      <HowItWorksSection id="how" />

      <section id="cafeslist">
        <div className="wrap">
          <div className="section-eyebrow label">Calgary&apos;s scene · sample data for this demo</div>
          <h2 className="section-title">Seeded from the ground up, one café at a time</h2>
          <p className="section-lede">
            The café names below are real; the taste profiles behind them are placeholders for this demo, not a
            real visit. Calgary&apos;s independent roasting scene is deep for a city this size — around ten serious
            roasters, several carrying international competition credentials — which is exactly the kind of city
            that argues about coffee and will actually use a matching app instead of a star rating. At launch, every
            café is visited and vectored in person — not scraped, not guessed (§22) — across roughly 60 cafés in six
            walkable clusters: Beltline, Mission/17th Ave, Inglewood, Kensington, Bridgeland, and downtown Stephen
            Ave. Every café gets listed for free; paying only unlocks promotion, never a better score.
          </p>
          <div className="cafes-strip">
            {cafes.map((c) => (
              <div className="cafe-chip" key={c.id}>
                {c.name}
                <span>{c.area}</span>
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
              <Link href="#signup" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 8 }}>
                Get started
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
            <div className="section-eyebrow label">For cafés · Calgary is a free trial</div>
            <h2 className="section-title">Every Featured perk. $0 through July 2027.</h2>
            <p className="section-lede">
              Cafés don&apos;t pay in Calgary — not at any tier, not during the trial. You get the full Featured
              platform in exchange for donating the odd free drink. See the founding terms, the math, and apply.
            </p>
            <Link href="/for-cafes" className="btn btn-primary">
              See partner details →
            </Link>
          </div>
        </div>
      </section>

      <section id="signup">
        <div className="wrap">
          <div className="signup-band">
            {showSignedIn ? (
              <>
                <div className="section-eyebrow label">Welcome back</div>
                <h2>You&apos;re signed in — your Taste and matches are ready.</h2>
                <p className="section-lede">Jump back into your matches, your City List, or your City Card.</p>
                <Link href="/today" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                  Open App
                </Link>
              </>
            ) : (
              <>
                <div className="section-eyebrow label">Save your Taste</div>
                <h2>Create your account. Keep the matches you just saw.</h2>
                <p className="section-lede">
                  Free, always. Create a password so your Taste and matches are here next time you open the site.
                </p>
                <SignupForm userVector={userVector} answeredDims={answeredDims} primaryDrinkCategory={primaryDrinkCategory} />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
