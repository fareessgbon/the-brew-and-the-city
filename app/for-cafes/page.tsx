import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FaqAccordion } from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'For Cafés — Brew and the City',
  description: "The first 15 approved Calgary cafés join free for six months. See the founding terms and tell us you're interested.",
};

// §12.1a — "discovery is a timeline, not a features table": the free,
// automatic, ongoing half (map, saves, City Picks, friend activity) comes
// first, separated from the paid redemption mechanics. Ends in the café
// survey, never a form that provisions an account — nothing here signs a
// café up for anything; §0.4 rules that out entirely at this stage.
export default function ForCafesPage() {
  return (
    <>
      <SiteHeader current="for-cafes" />

      <section style={{ padding: '56px 0 8px' }}>
        <div className="wrap">
          <div className="label eyebrow">For cafés · Calgary launch cohort</div>
          <h1 style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: '22ch' }}>
            The first 15 Calgary cafés join free for six months.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink)', maxWidth: '56ch', margin: '20px 0 0' }}>
            We&apos;re building Brew and the City before asking any café to pay for it. Tell us about your café below
            — five minutes, no commitment — and you&apos;ll be first to hear when Founding Partner spots open.
          </p>
        </div>
      </section>

      <section style={{ padding: '40px 0 8px' }}>
        <div className="wrap">
          <div className="section-eyebrow label">Discovery never stops</div>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>A directory listing goes stale. Matching doesn&apos;t.</h2>
          <p style={{ fontSize: 15.5, color: 'var(--ink)', maxWidth: '64ch', marginBottom: 20 }}>
            A review-site listing is a one-time snapshot — you rank once, then compete for scroll position forever
            after. Match % works differently: every new sign-up runs the same taste quiz, and everyone whose taste
            actually fits your café gets shown you, today and every day after — not just the week you paid to be
            seen. You don&apos;t get discovered once — you keep getting discovered, for as long as you&apos;re on the
            map.
          </p>
          {/* Illustrative only — no real friend graph or matching exists yet at this stage (§12.1a). */}
          <div className="ratio-box" style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--whisk)', marginBottom: 10 }}>
              Mockup — not real data
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--paper-2)', borderRadius: 8 }}>
                <span>☕ Your Café</span>
                <span style={{ color: 'var(--ceremony)', fontWeight: 600 }}>91% match</span>
              </div>
              <div style={{ paddingLeft: 12, color: 'var(--whisk)' }}>“Maya saved this café”</div>
              <div style={{ paddingLeft: 12, color: 'var(--whisk)' }}>“Jordan ranked it #2 for Vibe”</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 8px' }}>
        <div className="wrap">
          <div className="round-card">
            <div className="label" style={{ marginBottom: 8 }}>
              Founding Partner
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '2px solid var(--sky)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Your Café</div>
                <div style={{ fontSize: 13, color: 'var(--whisk)' }}>Part of the first Calgary group</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
            {[
              ['First In The App', 'One of the first 15 cafés real Calgarians see when the product goes live.'],
              ['Priority Placement', 'Guaranteed inclusion in launch-week features and the Founding Partners page — permanently.'],
              ['More Local Attention', 'A dedicated launch post, a mini photo session, and rotation in seasonal guides.'],
              ['Launch Event Opportunity', 'Eligible to host or participate in the launch event itself.'],
            ].map(([title, body]) => (
              <div key={title} className="ratio-box">
                <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--whisk)' }}>{body}</div>
              </div>
            ))}
          </div>
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
              The founding terms, as planned
            </div>
            <h2 style={{ fontSize: 26 }}>Free for the first six months. Full terms if you stay.</h2>
            <div className="club-grid">
              <div>
                <ul className="club-list">
                  <li>Full Partner benefits free for the first 6 months — profile, menu matching, portal, promotion</li>
                  <li>City Card stamps included; monthly free-item redemption is optional, capped, and café-controlled</li>
                  <li>No POS integration, no new hardware — a web page and a PIN</li>
                  <li>30 days&apos; notice to leave; no surprise invoice — you choose what happens after six months</li>
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
                    Pricing after that is worked out with you directly — reach out and we&apos;ll walk you through it
                  </li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid var(--whisk-10)' }}>No payment method required to say you&apos;re interested</li>
                  <li style={{ padding: '8px 0' }}>Nothing is binding yet — this page is the pitch, not the agreement</li>
                </ul>
              </div>
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
