'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NEUTRAL_VECTOR, clampDim, type ContextKey, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';
import { mapsTestLine } from '@/lib/mapsTestLine';
import { clearTasteState, loadTasteState, saveTasteState } from '@/lib/localTaste';
import { HeroQuiz, type HeroCafe } from '@/components/HeroQuiz';
import { WaitlistForm } from '@/components/WaitlistForm';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { StampIcons } from '@/components/StampIcons';
import { Marquee } from '@/components/Marquee';
import { useCity } from '@/components/CityProvider';
import { CITY_LABELS } from '@/lib/data/cafeFields';

// Has to match HERO_QUIZ's own taste-dim questions exactly (lib/data/quiz.ts)
// — calculateMatch() only scores a dim it's told was actually answered, so
// a dim asked here but missing from this list would just silently sit at
// its neutral default. Grew from ['drink', 'energy'] when the quiz gained a
// 4th question (pace) on request, for one more real dimension instead of
// one more neutral one.
// The ticker used to list real café names, which read as if they were already
// partners. It names the two cities instead: no café is named here.
const RECRUIT_LINES = [
  'Cafés in Calgary',
  'Cafés in Toronto',
  'Independent cafés',
  'Calgary & Toronto',
  'Cafés in Calgary',
  'Cafés in Toronto',
  'Independent cafés',
  'Calgary & Toronto',
];

// Once the visitor has chosen a city the ticker talks about that city only.
function marqueeLines(cityLabel: string | null): string[] {
  if (!cityLabel) return RECRUIT_LINES;
  const lines = [`Cafés in ${cityLabel}`, 'Independent cafés', `${cityLabel} first`, 'Matched to your taste'];
  return [...lines, ...lines];
}

const ANSWERED_DIMS: Dim[] = ['drink', 'energy', 'pace'];

// The real, interactive quiz + matching engine, restored for the pre-launch
// homepage so visitors get a genuine idea of what the product will do —
// distinct from §0.4's own recommendation, per an explicit product
// decision (see chat). No account gets created anywhere in this flow: the
// end state is the waitlist, not a real Supabase Auth sign-up. §0.4's "no
// accounts, ever" no longer holds sitewide — Discover (components/
// DiscoverContent.tsx) is a deliberate, informed exception — but it still
// holds for this quiz specifically.
export function HomeContent({ cafes }: { cafes: HeroCafe[] }) {
  const [userVector, setUserVector] = useState<TasteVector>(NEUTRAL_VECTOR);
  const [answeredDims, setAnsweredDims] = useState<readonly Dim[]>(ANSWERED_DIMS);
  const [primaryDrinkCategory, setPrimaryDrinkCategory] = useState<PrimaryDrinkCategory | null>(null);
  const [context, setContext] = useState<ContextKey | null>(null);
  const [sixthRoundLine, setSixthRoundLine] = useState('');
  const { city } = useCity();
  const cityLabel = city ? CITY_LABELS[city] : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage view-counter read.
    setSixthRoundLine(
      mapsTestLine('sixth', 'Five visits anywhere in the network. One card, not six punch cards in your wallet.'),
    );
  }, []);

  // Picks the quiz back up where a returning visitor left it — no account
  // behind this (§0.4), just this browser's own localStorage (see
  // lib/localTaste.ts). Read-only on mount, deliberately not a write: an
  // effect that also wrote here would fire before this read's setState
  // commits and could stomp real saved answers with the NEUTRAL_VECTOR
  // this state starts at. Writes only ever happen from the handlers below,
  // in response to an actual click.
  useEffect(() => {
    const saved = loadTasteState();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage read, mirrors the sixthRoundLine effect above.
    setUserVector(saved.vector);
    setAnsweredDims(saved.answeredDims.length > 0 ? saved.answeredDims : ANSWERED_DIMS);
    setPrimaryDrinkCategory(saved.primaryDrinkCategory);
    setContext(saved.context);
  }, []);

  function handleAnswer(dim: Dim, delta: number) {
    setUserVector((prev) => {
      const next = { ...prev, [dim]: clampDim(prev[dim] + delta) };
      saveTasteState({ vector: next, answeredDims: [...answeredDims], primaryDrinkCategory, context });
      return next;
    });
  }

  function handleCategory(category: PrimaryDrinkCategory) {
    setPrimaryDrinkCategory(category);
    saveTasteState({ vector: userVector, answeredDims: [...answeredDims], primaryDrinkCategory: category, context });
  }

  function handleContext(value: ContextKey) {
    setContext(value);
    saveTasteState({ vector: userVector, answeredDims: [...answeredDims], primaryDrinkCategory, context: value });
  }

  function handleRetake() {
    setUserVector(NEUTRAL_VECTOR);
    setAnsweredDims(ANSWERED_DIMS);
    setPrimaryDrinkCategory(null);
    setContext(null);
    clearTasteState();
  }

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="label eyebrow">{cityLabel ?? 'Calgary & Toronto'}</div>
            <h1 className="hero-stack">
              <span className="line small">every good café,</span>
              <span className="line l-matched">MATCHED</span>
              <span className="line l-to">TO YOUR</span>
              <span className="line l-taste">TASTE</span>
            </h1>
            <div className="cta-row">
              <Link href="#waitlist" className="btn btn-primary">
                Join the waitlist
              </Link>
              <Link href="#how" className="btn btn-ghost">
                See how matching will work
              </Link>
            </div>
          </div>
          {/* Decorative scene: the illustration in a slowly morphing blob
              (it keeps its own cream ground — its maroon line work is
              functionally invisible on the cocoa hero), a spinning
              "coming soon" badge, and a sticker pointing at the real quiz.
              The image and badge are decoration (aria-hidden); the sticker
              is real content. */}
          <div className="hero-scene">
            <div className="hero-illustration-frame" aria-hidden="true">
              <Image
                src="/images/hero-cafe-scene.jpg"
                alt=""
                width={736}
                height={736}
                className="hero-illustration"
                priority
              />
            </div>
            {/* A single ring path read as one continuous loop puts its
                second half upside down — text follows the path's
                direction, and the bottom of a circle traversed the "same
                way round" as the top runs backwards from the viewer's
                side. Two arcs instead: the top one left-to-right as
                before, the bottom one right-to-left (the same physical
                semicircle, walked the other way), so both halves read
                upright rather than one flipping. */}
            <svg className="hero-badge" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <path id="badge-ring-top" d="M16,60 A44,44 0 0,1 104,60" />
                <path id="badge-ring-bottom" d="M16,60 A44,44 0 0,0 104,60" />
              </defs>
              <circle cx="60" cy="60" r="58" fill="currentColor" className="badge-disc" />
              <text className="badge-text">
                <textPath href="#badge-ring-top" startOffset="50%" textAnchor="middle">
                  coming soon · Calgary ·
                </textPath>
              </text>
              <text className="badge-text">
                <textPath href="#badge-ring-bottom" startOffset="50%" textAnchor="middle">
                  Toronto · coming soon ·
                </textPath>
              </text>
            </svg>
            <div className="hero-pick-sticker">
              <div className="label">Early preview</div>
              <strong>Try the matching quiz</strong>
              <span>Six quick questions, below</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real café names, not the curated neighbourhood list this used to
          show (see chat) — proof the network actually has cafés in it,
          not just areas of the city it plans to cover. Ties the band to
          however many cafés are actually active right now (6 as of this
          writing), so it'll feel thin until more get seeded — the honest
          tradeoff for not claiming a wider cohort than what's real.
          Directly after the hero on purpose (see chat) — both are
          --ceremony, and the scalloped edge under the band only reads as
          one continuous dark band trailing off the hero if nothing lighter
          sits between them. Putting #quiz here instead broke that. */}
      <Marquee items={marqueeLines(cityLabel)} />

      {/* The quiz, pulled out of the hero into its own section (see chat)
          — it used to sit beside the headline in a 2-column hero row;
          now it gets a proper intro (eyebrow/title/lede, same pattern
          every other section on this page uses) instead of competing with
          the headline for space. "Six questions" has to stay in sync with
          HERO_QUIZ's real length (lib/data/quiz.ts) — same trap the hero
          sticker's "Six questions away" text already has to avoid. */}
      <section id="quiz" className="scallop-bottom">
        <div className="wrap">
          <div className="section-eyebrow label">The quiz</div>
          <h2 className="section-title">Try a preview.</h2>
          <p className="section-lede">
            Six questions, no sign-up. The matches below use placeholder cafés — real ones appear as cafés join us.
          </p>
          <div className="quiz-wrap">
            <HeroQuiz
              cafes={cafes}
              userVector={userVector}
              answeredDims={answeredDims}
              primaryDrinkCategory={primaryDrinkCategory}
              context={context}
              onAnswer={handleAnswer}
              onCategory={handleCategory}
              onContext={handleContext}
              onRetake={handleRetake}
            />
          </div>
        </div>
      </section>

      <HowItWorksSection id="how" />

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
            {/* One grid cell holding both card designs; Design B's card picker decides which show. */}
            <div className="card-stack">
            {/* Design B only: the City Card drawn as a physical loyalty card
                — a front and a back, like the printed cards it's modelled
                on — in place of .round-card below (hidden in B; this is
                hidden in A). */}
            <div className="loyalty-cards" aria-hidden="true">
              <div className="lc lc-front">
                <div className="lc-top">
                  <span>{cityLabel ?? 'Calgary · Toronto'}</span>
                  <span>City Card</span>
                </div>
                <div className="lc-mid">
                  <div className="lc-art">
                    <StampIcons />
                  </div>
                  <div>
                    <div className="lc-brand">
                      Brew
                      <br />
                      and the City
                    </div>
                    <div className="lc-tag">A card for drinking your way across town</div>
                  </div>
                </div>
                <div className="lc-bottom">
                  <span>brewandthecity.com</span>
                  <span>
                    No. <i />
                  </span>
                </div>
              </div>
              <div className="lc lc-back">
                <div className="lc-top">
                  <div className="lc-title">Five visits. The next one&apos;s free.</div>
                  <div className="lc-note">
                    Earned
                    <br />
                    per visit
                  </div>
                </div>
                <div className="lc-stamps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div className={n <= 3 ? 'lc-stamp on' : 'lc-stamp'} key={n}>
                      <StampIcons />
                    </div>
                  ))}
                  <div className="lc-stamp free">Free</div>
                </div>
                <div className="lc-bottom">
                  <span>Free from a partner café</span>
                  <span>Max 2 visits per café</span>
                </div>
              </div>
            </div>
            <div className="round-card">
              {/* Card header — only Design B shows it, to make the panel read
                  as an actual loyalty card (see the design-b block in
                  globals.css). */}
              <div className="card-brand">
                <span>Brew and the City</span>
                <span>City Card</span>
              </div>
              <div className="label">Your City Card</div>
              <div className="stamp-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div className="stamp done" key={n}>
                    <span className="stamp-num">{n}</span>
                    <StampIcons />
                  </div>
                ))}
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
        </div>
      </section>

      {/* Two questions the City Card section above doesn't already answer
          — how the card relates to the rest of the app, not how the card
          itself works (that section's own bullet list already covers
          that). Kept to real mechanics only: no membership tier, no credit
          currency, no activity score — this app doesn't have those,
          whatever "Sip Club" content elsewhere describes (see chat). */}
      <section id="city-card-faq">
        <div className="wrap">
          <div className="section-eyebrow label">About the City Card</div>
          <h2 className="section-title">A couple more things.</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Do I need friends on the app to get good matches?</h3>
              <p>
                No. Matching runs on your own taste alone. Friends, once you add them, are weighted in by how
                close their taste is to yours — not by how close your friendship is.
              </p>
            </div>
            <div className="faq-item">
              <h3>Can I use the app without the City Card?</h3>
              <p>
                Yes. Matching and your City List work on their own — the City Card is automatic once you join,
                not something separate to opt into.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About — what Brew and the City is, in the same words the careers
          posting already uses for it. No founder story or numbers here on
          purpose: only things that are true of the product today. */}
      <section id="about">
        <div className="wrap">
          <div className="section-eyebrow label">About</div>
          <h2 className="section-title">Finding your café shouldn&apos;t be a guessing game.</h2>
          <div className="about-grid">
            <p className="section-lede">
              Brew and the City is a new discovery platform that helps people find independent cafés, and helps
              local cafés get discovered. We&apos;re starting in Calgary and Toronto, and building a community
              around the cafés, people and places that make a city worth exploring.
            </p>
            <ul className="about-points">
              <li>
                <strong>Matched to your taste.</strong> Answer a few questions and we match you to cafés that fit
                — not just the ones with the most reviews.
              </li>
              <li>
                <strong>Independent first.</strong> Local, owner-run cafés are the whole point, not an afterthought.
              </li>
              <li>
                <strong>Built with cafés.</strong> Founding cafés help shape how they&apos;re matched before we launch.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cafés are half of what this launch needs — a recruiting call sits
          right above the waitlist so an owner doesn't have to hunt for it. */}
      <section id="for-cafes-call">
        <div className="wrap">
          <div className="cafe-call">
            <div>
              <div className="section-eyebrow label">For cafés</div>
              <h2>Run a café? Be one of the first on Brew.</h2>
              <p>
                We&apos;re signing up founding cafés now, before launch. Tell us about your place and help shape how
                it&apos;s matched to the people who&apos;ll love it.
              </p>
            </div>
            <Link href="/for-cafes" className="btn btn-primary">
              Partner with us
            </Link>
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
            <div className="section-eyebrow label">Be first in {cityLabel ?? 'Calgary & Toronto'}</div>
            <h2>Join the list. Be first to try Brew in {cityLabel ?? 'your city'}.</h2>
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
