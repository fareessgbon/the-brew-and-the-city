import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FaqAccordion } from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'For Cafés — Brew and the City',
  description:
    "Get discovered by customers who already match your café — real Match %, not a review count. The first 15 approved Calgary cafés also get full Partner access free for six months.",
};

// §12.1a — "discovery is a timeline, not a features table": the free,
// automatic, ongoing half (map, saves, City Picks, friend activity) comes
// first, separated from the paid redemption mechanics. Ends in the café
// survey, never a form that provisions an account — nothing here signs a
// café up for anything; §0.4 rules that out entirely at this stage.
//
// Positioning pass (see chat): discovery/acquisition leads, City Card is a
// benefit mentioned after pricing, not the pitch. Awards are stated once,
// in the firewall banner, as tier-independent — no pricing tier lists
// "awards eligibility" as a paid perk, because it isn't one.
export default function ForCafesPage() {
  return (
    <>
      <SiteHeader current="for-cafes" />

      <section style={{ padding: '56px 0 8px' }}>
        <div className="wrap forcafe-intro-grid">
          <div>
            <div className="label eyebrow">For Calgary cafés</div>
            <h1 style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              Get discovered by customers who already match your café.
            </h1>
            <p style={{ fontSize: 18, color: 'var(--ink)', margin: '20px 0 0' }}>
              Real Match %, not a review count — every sign-up runs the same taste quiz, and everyone whose taste
              actually fits your café sees you. The first 15 approved cafés get full Partner access free for six
              months to prove it.
            </p>
            <Link href="/help-shape-the-app/cafe-partner-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 20 }}>
              Tell us about your café
            </Link>

            <div className="section-eyebrow label" style={{ marginTop: 40 }}>
              Discovery never stops
            </div>
            <h2 style={{ fontSize: 26, marginBottom: 12 }}>A directory listing goes stale. Matching doesn&apos;t.</h2>
            <p style={{ fontSize: 15.5, color: 'var(--ink)' }}>
              A review-site listing is a one-time snapshot — you rank once, then compete for scroll position forever
              after. Match % works differently: every new sign-up runs the same taste quiz, and everyone whose taste
              actually fits your café gets shown you, today and every day after — not just the week you paid to be
              seen. You don&apos;t get discovered once — you keep getting discovered, for as long as you&apos;re on
              the map.
            </p>
          </div>

          {/* Illustrative only — no real friend graph or matching exists yet at this stage (§12.1a). Placeholder
              café names, not real seeded ones — this is activity that hasn't happened, so it shouldn't look like
              it happened at an actual Calgary business. */}
          <div className="ratio-box" style={{ alignSelf: 'start', background: 'transparent' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
              {[
                ['C', 'var(--sky-deep)', <>
                  <strong>Carson</strong> just recommended <strong>The Roasted Fox</strong> to a friend
                </>, '1h ago', 0],
                ['D', 'var(--whisk)', <>
                  <strong>Donte</strong> just earned a stamp at <strong>Nook &amp; Bean</strong>
                </>, 'yesterday', 28],
                ['R', 'var(--sky)', <>
                  <strong>Rayne</strong> rated <strong>Sundial Coffee</strong> best for study vibes
                </>, '3h ago', 0],
                ['Q', 'var(--blush)', <>
                  <strong>Quinn</strong> just got an 87% match to <strong>Corner Press Coffee</strong>
                </>, '2 days ago', 28],
                ['V', 'var(--sky-deep)', <>
                  <strong>Vanessa</strong> added <strong>The Roasted Fox</strong> to her City List
                </>, '2 days ago', 0],
                ['K', 'var(--whisk)', <>
                  <strong>Kai</strong> just earned a stamp at <strong>Nook &amp; Bean</strong>
                </>, '3 days ago', 28],
              ].map(([initial, color, text, when, indent], i) => (
                <div
                  key={i as number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginLeft: indent as number,
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: color as string,
                      color: 'var(--ceremony)',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', flex: 1 }}>{text}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--whisk)', flexShrink: 0 }}>{when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 16px' }}>
        <div className="wrap">
          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 8 }}>
            What each tier includes
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="tier-name">Listed</div>
              <div className="tier-price">Free</div>
              <ul>
                <li>Searchable map listing</li>
                <li>Honest Match % — same rules as every paid café</li>
                <li>Save, directions, and share from your profile</li>
              </ul>
            </div>
            <div className="price-card featured-tier">
              <div className="tier-name">Founding Partner · first 15</div>
              <div className="tier-price">Free · 6 mo</div>
              <ul>
                <li>Everything in Partner, free for six months</li>
                <li>Founding badge, decal, and a permanent place on the Founding Partners page</li>
                <li>A launch-week feature and an onboarding photo session</li>
                <li>Direct input into the early roadmap</li>
                <li>Then $49/month, locked for 24 months — never rises to $89</li>
              </ul>
            </div>
            <div className="price-card">
              <div className="tier-name">Partner</div>
              <div className="tier-price">$89/mo</div>
              <ul>
                <li>Everything in Listed</li>
                <li>Tagged menu — named drink recommendations, not just the café</li>
                <li>City Card stamps, plus optional monthly reward redemption</li>
                <li>Café Portal — weekly numbers, quarterly written insights</li>
                <li>One guaranteed group feature per quarter</li>
              </ul>
            </div>
            <div className="price-card">
              <div className="tier-name">Featured · capped at 8</div>
              <div className="tier-price">$189/mo</div>
              <ul>
                <li>Everything in Partner</li>
                <li>One dedicated post or reel monthly, plus a story series</li>
                <li>Quarterly photo shoot, ~10 images, yours to keep</li>
                <li>Homepage placement, 1 week per quarter</li>
                <li>Quarterly insight call and deeper aggregate analytics</li>
              </ul>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 12 }}>
            Annual Partner and Featured plans get two months free ($890/yr and $1,890/yr).
          </p>
        </div>
      </section>

      <section style={{ padding: '8px 0 32px' }}>
        <div className="wrap">
          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 8 }}>
            What you&apos;d pay for this separately
          </div>
          <div className="pricing-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="ratio-box">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>
                  <span>One local micro-influencer post</span>
                  <span style={{ color: 'var(--whisk)' }}>$150–400 one-off</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>
                  <span>A content photographer, half-day</span>
                  <span style={{ color: 'var(--whisk)' }}>$300–600 one-off</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>
                  <span>Meta ads, meaningful local reach</span>
                  <span style={{ color: 'var(--whisk)' }}>$300–800/mo + someone to run it</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span>A single loyalty-app SaaS seat</span>
                  <span style={{ color: 'var(--whisk)' }}>$50–150/mo</span>
                </li>
              </ul>
            </div>
            <div className="round-card">
              <div className="label">Brew and the City Partner</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, margin: '6px 0' }}>
                $89/mo
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--whisk)', margin: 0 }}>
                Ongoing, plus a reward program you fund at roughly $4 per redemption — real customer taste
                research isn&apos;t purchasable at any price, at any of the rates above.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '16px 0 48px' }}>
        <div className="wrap">
          <div className="club-band" style={{ margin: '0 0 40px' }}>
            <div className="section-eyebrow label" style={{ color: 'var(--sky)' }}>
              Founding Café Partners · first 15
            </div>
            <h2 style={{ fontSize: 26 }}>Not a free trial — a founding stake, not just six free months.</h2>
            <div className="club-grid">
              <div>
                <ul className="club-list">
                  <li>Full Partner access, free for the first 6 months</li>
                  <li>Founding recognition — permanently listed on the Founding Partners page</li>
                  <li>Launch visibility — priority placement in launch-week features, a dedicated post, and a mini photo session</li>
                  <li>Product feedback influence — your input shapes the roadmap before anyone else&apos;s does</li>
                  <li>Locked founding pricing after launch — your rate won&apos;t rise later just because you joined early</li>
                  <li>No POS integration, no new hardware — a web page and a PIN</li>
                </ul>
                <Link href="/help-shape-the-app/cafe-partner-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 8 }}>
                  Tell us about your café
                </Link>
              </div>
              <div className="round-card">
                <div className="label">Interested? Let&apos;s talk.</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', fontSize: 14.5 }}>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>Free for the first 15 approved cafés, 6 months</li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>
                    Then $49/month, locked for 24 months — or step down to a free Listed profile any time
                  </li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>No payment method required to say you&apos;re interested</li>
                  <li style={{ padding: '8px 0' }}>Nothing is binding yet — this page is the pitch, not the agreement</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="section-eyebrow label">Included with Partner</div>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>The City Card — one card, every café, five visits.</h2>
          <p style={{ fontSize: 15.5, color: 'var(--ink)', maxWidth: '68ch', marginBottom: 12 }}>
            You choose the item — up to five, submitted by the 25th for the month ahead, changeable any time. You
            choose the hours — protect your rush, fill Tuesday at 2pm. You set a monthly cap (10 redemptions is the
            default), so this can never cost more than you decided. No POS integration, no new hardware — a receipt
            and a PIN.
          </p>
          <p style={{ fontSize: 15.5, color: 'var(--ink)', maxWidth: '68ch', marginBottom: 32 }}>
            Five paid visits — max two at any single café, so a completed card always crosses at least three
            different partners — unlock one item from your list for the member, entirely free. During your six
            founding months, you cover that item yourself, within the cap you set. Once you&apos;re on a paid plan,
            we reimburse roughly $4 per redemption — an average of about $32.50 in real, paid visits for every $4 you
            give away, an 8:1 ratio. Every redeemer already matched with you — not a random deal-hunter.
          </p>

          <div className="firewall-banner" style={{ marginBottom: 24 }}>
            <div className="firewall-mark">✕</div>
            <div>
              <div className="firewall-title">What money can never buy</div>
              <div className="firewall-copy">
                A higher Match %, not for any price. A spot in anyone&apos;s top 3 — results are ordered by fit
                alone. An award — those come from real head-to-head results, and unpaid cafés win them just as
                often. Removal of a competitor from the map. Suppression of a bad Insights report. You cannot buy a
                better score here, and that&apos;s exactly why a genuinely good café wants to be on this platform
                instead of Yelp.
              </div>
            </div>
          </div>

          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 8 }}>
            Questions owners ask
          </div>
          <FaqAccordion />

          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ color: 'var(--whisk)', marginBottom: 8 }}>
              Not ready to commit to anything? Tell us anyway.
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--ink)', maxWidth: '56ch', marginBottom: 12 }}>
              A five-minute survey — your name, café, and what you&apos;d actually want from something like this. No
              account, no obligation.
            </p>
            <Link href="/help-shape-the-app/cafe-partner-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
              Take the café survey
            </Link>{' '}
            <span style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
              or email <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
