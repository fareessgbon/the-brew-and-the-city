import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Marquee } from '@/components/Marquee';

export const metadata: Metadata = pageMetadata({
  title: 'For Cafés — Brew and the City',
  description:
    "Get discovered by customers who already match your café — a Match % built on taste, not a review count. The first 15 approved Calgary and Toronto cafés get full Partner access free for six months.",
  canonical: '/for-cafes',
});

// §12.1a — "discovery is a timeline, not a features table": the free,
// automatic, ongoing half (map, saves, City Picks, friend activity) comes
// first, separated from the paid redemption mechanics. Ends in the café
// survey, never a form that provisions an account — nothing here signs a
// café up for anything; §0.4 rules that out entirely at this stage.
//
// Positioning pass (see chat): discovery/acquisition leads, City Card is a
// benefit mentioned after pricing, not the pitch.
//
// Redesign (see chat): the invented friend-activity feed that used to sit
// beside the headline is gone — it showed made-up people doing things at
// made-up cafés, which reads as real traction on a page whose whole pitch is
// trust. It's replaced by the three real steps of how a café gets found.
//
// The "What money can never buy" banner that used to close this page is
// gone (removed on request). Awards are therefore not mentioned anywhere on
// this page — keep it that way rather than reintroducing them in a pricing
// tier, since award eligibility has never depended on what a café pays.
// The homepage's own firewall banner (HowItWorksSection) also used to
// state the can't-pay-for-a-better-Match-% rule to consumers — it's gone
// too (removed on request, see chat), so as of now that rule isn't stated
// anywhere on the site. Worth knowing before assuming it's covered
// elsewhere if this page's own silence on it is ever questioned.
export default function ForCafesPage() {
  return (
    <>
      <SiteHeader current="for-cafes" />
      <main id="content" className="fc">
        <section className="fc-hero">
          <div className="wrap fc-hero-grid">
            <div>
              <div className="label eyebrow">For Calgary &amp; Toronto cafés</div>
              <h1>Get discovered by customers who already match your café.</h1>
              <p className="fc-lede">
                A Match % built on taste, not a review count — everyone whose taste actually fits your café sees you.
              </p>
              <div className="fc-cta">
                <Link href="/make-brew-better/cafe-partner-survey" className="btn btn-primary">
                  Tell us about your café
                </Link>
                <a href="#tiers" className="btn btn-ghost">
                  See what&apos;s included
                </a>
              </div>
            </div>
            <div className="fc-offer-badge" aria-label="Founding offer">
              <span className="fc-offer-num">6</span>
              <span className="fc-offer-unit">months free</span>
              <span className="fc-offer-note">for the first 15 approved cafés</span>
            </div>
          </div>
        </section>

        <Marquee items={['Founding café spots open','First 15 cafés get six months free','Get discovered by taste','Calgary & Toronto','Founding café spots open','First 15 cafés get six months free']} />

        <section className="fc-section">
          <div className="wrap">
            <div className="section-eyebrow label">Discovery never stops</div>
            <h2 className="section-title">A directory listing goes stale. Matching doesn&apos;t.</h2>
            <p className="section-lede">
              A review-site listing is a one-time snapshot — you rank once, then compete for scroll position forever
              after. Match % works differently.
            </p>
            <ol className="fc-steps">
              <li>
                <span className="fc-step-num">1</span>
                <h3>Someone takes the quiz</h3>
                <p>Every new sign-up answers the same short taste quiz, in their own city.</p>
              </li>
              <li>
                <span className="fc-step-num">2</span>
                <h3>Taste meets taste</h3>
                <p>Your café has its own taste profile. We compare the two — drinks, room, pace, food.</p>
              </li>
              <li>
                <span className="fc-step-num">3</span>
                <h3>You show up in their top 3</h3>
                <p>Everyone whose taste fits yours is shown you, today and every day after — not just the week you paid to be seen.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="fc-section fc-tiers" id="tiers">
          <div className="wrap">
            <div className="section-eyebrow label">What each tier includes</div>
            <div className="pricing-grid">
              <div className="price-card">
                <div className="tier-name">Starter</div>
                <div className="tier-price">Free</div>
                <ul>
                  <li>Matchable café listing</li>
                  <li>A Match % for every customer</li>
                  <li>Profile — hours, photos</li>
                </ul>
              </div>
              <div className="price-card featured-tier">
                <div className="tier-name">Partner</div>
                <div className="tier-price">Let&apos;s talk</div>
                <ul>
                  <li>Everything in Starter</li>
                  <li>City Card participation</li>
                  <li>Café portal</li>
                  <li>Customer insights</li>
                  <li>Standard promotion — City Picks rotation, group content</li>
                </ul>
              </div>
              <div className="price-card">
                <div className="tier-name">Premium · capped at 8</div>
                <div className="tier-price">Let&apos;s talk</div>
                <ul>
                  <li>Everything in Partner</li>
                  <li>Quarterly photo shoot, ~10 images, yours to keep</li>
                  <li>One dedicated Instagram post or reel monthly</li>
                  <li>Homepage placement, 1 week per quarter</li>
                  <li>Advanced insights — why people passed on you</li>
                  <li>Priority support and launch opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="fc-section">
          <div className="wrap">
            <div className="fc-founding">
              <div>
                <div className="section-eyebrow label">Founding Café Partners · first 15</div>
                {/* "Not a free trial — a founding stake, not just six free
                    months" argued with itself: it denied the free trial in
                    the same breath as offering six free months. The offer is
                    unchanged; it's stated instead of positioned. */}
                <h2 className="fc-founding-title">
                  Six months of Partner access, free — and founding status that doesn&apos;t expire with it.
                </h2>
                <p className="fc-founding-lede">
                  Fifteen cafés, once — Calgary and Toronto. The six months are free; what you keep afterwards is the
                  recognition, the launch visibility, and a rate that doesn&apos;t rise because you were early.
                </p>
                <ul className="fc-checks">
                  <li>Full Partner access, free for the first 6 months</li>
                  <li>Founding recognition — permanently listed on the Founding Partners page</li>
                  <li>Launch visibility — priority placement in launch-week features, a dedicated post, and a mini photo session</li>
                  <li>Product feedback influence — your input shapes the roadmap before anyone else&apos;s does</li>
                  <li>Locked founding pricing after launch — your rate won&apos;t rise later just because you joined early</li>
                  <li>No POS integration, no new hardware — a web page and a PIN</li>
                </ul>
                <Link href="/make-brew-better/cafe-partner-survey" className="btn btn-primary">
                  Tell us about your café
                </Link>
              </div>
              <aside className="fc-fine">
                <div className="label">Interested? Let&apos;s talk.</div>
                <ul>
                  <li>Free for the first 15 approved cafés, 6 months</li>
                  <li>Pricing after that is worked out with you directly — reach out and we&apos;ll walk you through it</li>
                  <li>No payment method required to say you&apos;re interested</li>
                  <li>Nothing is binding yet — this page is the pitch, not the agreement</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className="fc-section">
          <div className="wrap">
            <div className="section-eyebrow label">Included with Partner</div>
            <h2 className="section-title">The City Card — one card, every café, five visits.</h2>
            <p className="section-lede">
              One City Card works everywhere in the network — so customers who discover you show up ready to redeem,
              not just browse. Five stamps (one drink each, max two at any café) unlock a free item, entirely on your
              terms — you decide what, never a blanket &quot;anything on the menu.&quot; No POS, no hardware — just a
              receipt and a PIN. You only pay out when someone redeems with you specifically; every other stamp on
              their card was earned, and cost you nothing, elsewhere.
            </p>
          </div>
        </section>

        <section className="fc-section">
          <div className="wrap">
            <div className="fc-final">
              <h2>Not ready to commit to anything? Tell us anyway.</h2>
              <p>
                A five-minute survey — your name, café, and what you&apos;d actually want from something like this. No
                account, no obligation.
              </p>
              <div className="fc-cta">
                <Link href="/make-brew-better/cafe-partner-survey" className="btn btn-primary">
                  Take the café survey
                </Link>
                <span className="fc-mail">
                  or email <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
