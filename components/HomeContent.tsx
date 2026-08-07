'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { mapsTestLine } from '@/lib/mapsTestLine';
import type { HeroCafe } from '@/components/HeroQuiz';
import { WaitlistForm } from '@/components/WaitlistForm';
import { HowItWorksSection } from '@/components/HowItWorksSection';

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

// §12.1a — "no live quiz here, and that's deliberate": a mini-quiz that
// resolves to 'your top match' needs seeded cafés and a working scoring
// function, and this phase has neither. An earlier version of this build
// ran the real quiz anyway, on an explicit product decision that overrode
// this same spec section — see chat for that decision and this one, which
// reverses it back to spec. If this needs to flip again, HeroQuiz,
// HeroFeatureList, BeanMascot, and lib/matching are all still here, just
// unused from this file.
export function HomeContent({ cafes }: { cafes: HeroCafe[] }) {
  const [sixthRoundLine, setSixthRoundLine] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage view-counter read.
    setSixthRoundLine(
      mapsTestLine('sixth', 'Five visits anywhere in the network. One card, not six punch cards in your wallet.'),
    );
  }, []);

  const seededAreas = new Set(cafes.map((c) => c.area));
  const coreNeighbourhoods = CORE_NEIGHBOURHOODS.filter((n) => seededAreas.has(n));

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-copy" style={{ maxWidth: 560 }}>
            <div className="label eyebrow">Calgary, Alberta · coming soon</div>
            <h1 style={{ fontSize: 44, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '10px 0 0' }}>
              Matched to your next favourite café, before Calgary finds it.
            </h1>
            <p className="lede">
              Calgary has 60+ independent cafés. We&apos;re building a way to match you to yours — by taste, not by
              review count.
            </p>
            <WaitlistForm />
            <div className="cta-row" style={{ marginTop: 12 }}>
              <Link href="#how" className="btn btn-ghost">
                See how matching works
              </Link>
              <Link href="/for-cafes" className="btn btn-ghost">
                Café owner? →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection id="how" />

      <section id="cafeslist">
        <div className="wrap">
          <div className="section-eyebrow label">Calgary&apos;s scene · built cluster by cluster</div>
          <h2 className="section-title">
            Real neighbourhoods, seeded one café at a time — the first 15 join free.
          </h2>
          <p className="section-lede">
            Every café shown here is a real Calgary business; taste profiles are placeholders until launch. We&apos;re
            building this before asking any café to pay for it — the first 15 approved cafés join free for six
            months.
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
          <div className="section-eyebrow label">The City Card · Free, always</div>
          <h2>Five visits. Your free item is on us.</h2>
          <div className="club-grid">
            <div>
              <ul className="club-list">
                <li>One personal card, automatic at signup — not tied to any one café</li>
                <li>
                  One drink purchased at any partner café earns a visit — what you get free is whatever that café
                  is willing to redeem it for, subject to availability
                </li>
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
                5 visits unlocks a free item wherever you redeem — subject to what that café offers and has
                available. Max 2 visits per café, so it&apos;s always at least 3 spots.
              </div>
              {sixthRoundLine ? <div className="maps-test-line" style={{ marginTop: 12 }}>{sixthRoundLine}</div> : null}
            </div>
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
