import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CafeApplicationForm } from '@/components/CafeApplicationForm';
import { FaqAccordion } from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'For Cafés — Brew and the City',
  description: 'Calgary cafés get the full Featured platform free through July 2027. See the founding terms, the math, and apply as a partner.',
};

export default function ForCafesPage() {
  return (
    <>
      <SiteHeader current="for-cafes" />

      <section style={{ padding: '56px 0 8px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div className="label eyebrow">For cafés · Calgary is a free trial</div>
            <Link href="/portal" style={{ fontSize: 13.5 }}>
              Already a partner? Café login →
            </Link>
          </div>
          <h1 style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: '22ch' }}>
            Every Featured perk. $0 through July 2027.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink)', maxWidth: '56ch', margin: '20px 0 0' }}>
            Cafés don&apos;t pay in Calgary — not at any tier, not during the trial. You get the full Featured
            platform: dedicated content, a quarterly photo shoot, Café Insights, the lot. In exchange, you donate
            the odd free drink. That&apos;s the whole ask.
          </p>
        </div>
      </section>

      <section style={{ padding: '40px 0 8px' }}>
        <div className="wrap">
          <div className="section-eyebrow label">Discovery never stops</div>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>A directory listing goes stale. Matching doesn&apos;t.</h2>
          <p style={{ fontSize: 15.5, color: 'var(--ink)', maxWidth: '64ch' }}>
            A review-site listing is a one-time snapshot — you rank once, then compete for scroll position forever
            after. Match % works differently: every new sign-up runs the same nine questions, and everyone whose
            taste actually fits your café gets shown you, today and every day after, not just the week you paid to
            be seen. You don&apos;t get discovered once — you keep getting discovered, for as long as you&apos;re on
            the map.
          </p>
        </div>
      </section>

      <section style={{ padding: '32px 0' }}>
        <div className="wrap">
          <div className="section-eyebrow label">The City Card</div>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>One card, every café, five visits.</h2>
          <p style={{ fontSize: 15.5, color: 'var(--ink)', maxWidth: '64ch', marginBottom: 16 }}>
            Every member gets one City Card, automatic at signup — it isn&apos;t tied to any single café. A visit at
            any partner café earns a stamp toward it: they upload a receipt from your page, you approve it in the
            portal (no POS, no hardware), and it counts. Five stamps — max two from the same café — unlocks one free
            item, redeemable at any partner in the network, not necessarily yours. You only pay out when a member
            redeems with you specifically; the other visits on their card happened at other cafés and cost you
            nothing.
          </p>
        </div>
      </section>

      <section style={{ padding: '16px 0 48px' }}>
        <div className="wrap">
          <div className="club-band" style={{ margin: '0 0 40px' }}>
            <div className="section-eyebrow label" style={{ color: 'var(--sky)' }}>
              Your founding terms
            </div>
            <h2 style={{ fontSize: 26 }}>Price it now. Charge later. In writing.</h2>
            <div className="club-grid">
              <div>
                <ul className="club-list">
                  <li>Full Featured tier, free — dedicated posts, quarterly shoot, Café Insights, rejection reasons</li>
                  <li>You donate the reward item — your standard 12oz hot or iced drink, your hours, your monthly cap</li>
                  <li>No POS integration, no new hardware — a web page and a PIN</li>
                  <li>We show you the attach rate — what share of redemptions came with a paid purchase</li>
                </ul>
                <Link href="#cafe-apply" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 8 }}>
                  Apply as a Founding Partner
                </Link>
              </div>
              <div className="round-card">
                <div className="label">One-page agreement</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', fontSize: 14.5 }}>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>
                    Free through <strong>July 31, 2027</strong>
                  </li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>
                    Then <strong>$49/mo</strong>, locked 24 months
                  </li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>30 days notice before the first invoice</li>
                  <li style={{ padding: '8px 0' }}>Cancel any time, no penalty, keep all photography</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="forcafe-band">
            <div>
              <div className="ratio-box">
                <div className="ratio-row">
                  <span>What Featured tier is worth</span>
                  <span>$189/mo</span>
                </div>
                <div className="ratio-row muted">
                  <span>What ~15 donated drinks cost you</span>
                  <span>~$25/mo</span>
                </div>
                <div className="ratio-total">
                  <span>What you actually pay, during the trial</span>
                  <span>$0</span>
                </div>
              </div>
              <ul className="forcafe-list">
                <li>Every redeemer matched with you and paying for four drinks elsewhere to get there — not a random deal-hunter</li>
                <li>You set the monthly cap — required, no nulls. At the cap you&apos;re still matchable, just not reward-eligible until next month</li>
                <li>
                  Roughly 8 paying visits for every free item redeemed, network-wide — members earn the City Card by paying for
                  drinks at cafés across Calgary, not just yours, and it costs you one drink when they cash it in with you
                </li>
                <li>
                  Paying more never moves your Match %. It only gets you found — see §5.1 in our <Link href="/how-it-works">how-it-works</Link> section
                </li>
              </ul>
            </div>
            <div className="portal-mock">
              <div className="top">
                <span>Your Café</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 13, color: 'var(--whisk)' }}>This week</span>
              </div>
              <div className="scan">Scan to redeem</div>
              <div className="item">
                <strong>14 stamps issued</strong> · 3 first-time customers
                <br />
                ~$91 in matched visits
              </div>
              <div style={{ fontSize: 11, color: 'var(--whisk)', marginTop: 14 }}>
                Illustrative portal preview — sample numbers, not a real partner&apos;s data.
              </div>
            </div>
          </div>

          <div className="label" style={{ color: 'var(--whisk)', marginTop: 36 }}>
            What locks in after July 2027
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="tier-name">Listed</div>
              <div className="tier-price">Free</div>
              <ul>
                <li>On the map, fully matchable</li>
                <li>Real Match % for every user</li>
                <li>Profile, hours, photos</li>
              </ul>
            </div>
            <div className="price-card featured-tier">
              <div className="tier-name">Partner</div>
              <div className="tier-price">
                $89<span>/mo</span>
              </div>
              <ul>
                <li>Everything in Listed</li>
                <li>The City Card network</li>
                <li>Awards eligibility</li>
                <li>Portal + Café Insights</li>
                <li>Group content features</li>
              </ul>
            </div>
            <div className="price-card">
              <div className="tier-name">Featured · capped at 8</div>
              <div className="tier-price">
                $189<span>/mo</span>
              </div>
              <ul>
                <li>Everything in Partner</li>
                <li>Quarterly photo shoot, ~10 images, yours to keep</li>
                <li>One dedicated Instagram post or reel monthly</li>
                <li>Homepage placement, 1 week per quarter</li>
                <li>Rejection reasons — why people passed on you</li>
              </ul>
            </div>
            <div className="price-card">
              <div className="tier-name">Founding Partner</div>
              <div className="tier-price">
                $49<span>/mo</span>
              </div>
              <ul>
                <li>Locked 24 months, first 15 cafés only</li>
                <li>Everything in Partner</li>
                <li>Launch-event priority</li>
                <li>Roadmap input</li>
              </ul>
            </div>
          </div>

          <div className="firewall-banner" style={{ marginBottom: 24 }}>
            <div className="firewall-mark">✕</div>
            <div>
              <div className="firewall-title">What money can never buy</div>
              <div className="firewall-copy">
                A higher Match %, not for any price. A spot in anyone&apos;s top 3 — results are ordered by fit
                alone. An award — those come from real head-to-head results, and unpaid cafés win them. Removal of
                a competitor from the map. Suppression of a bad Insights report. You cannot buy a better score
                here, and that&apos;s exactly why a genuinely good café wants to be on this platform instead of
                Yelp.
              </div>
            </div>
          </div>

          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 8 }}>
            Questions owners ask
          </div>
          <FaqAccordion />

          <div id="cafe-apply">
            <div className="label" style={{ color: 'var(--whisk)', marginTop: 8 }}>
              Apply as a Founding Partner
            </div>
            <CafeApplicationForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
