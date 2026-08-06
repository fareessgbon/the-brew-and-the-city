import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service — Brew and the City',
  description: 'The terms for using Brew and the City as a member or a partner café, including the Match % firewall commitment.',
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0 8px' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 10 }}>
            Legal
          </div>
          <h1 style={{ fontSize: 38 }}>Terms of Service</h1>
          <div style={{ color: 'var(--whisk)', fontSize: 13, marginTop: 10 }}>
            Last updated August 3, 2026 · Brew and the City, Calgary, Alberta
          </div>
        </div>
      </section>

      <section className="legal" style={{ padding: '24px 0 72px' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <p>
            These terms cover anyone using Brew and the City — as a member finding cafés, or as a café applying to be
            listed or featured. By using the site, signing up, or applying as a partner, you agree to them. See our{' '}
            <Link href="/privacy">Privacy Policy</Link> for what we collect and why.
          </p>

          <div className="notice-box dark">
            <strong>The commitment this whole product is built on:</strong> a café can pay to be listed, featured,
            or entered into the City Card network. A café can never pay for a better Match %. Every café gets the
            same honestly-computed number for every visitor, partner or not. We treat this as a binding commitment
            to our members, not a marketing line — see §3 below.
          </div>

          <h2>1. What Brew and the City is</h2>
          <p>
            Brew and the City matches Calgary residents to independent cafés based on a self-reported taste profile,
            proximity, and (where enabled) social signal — not review counts or advertising spend. The version live
            today is a product demo; feature availability and the exact matching formula may change before general
            launch, but the commitment in §3 will not.
          </p>

          <h2>2. Accounts</h2>
          <ul>
            <li>You must provide accurate information when creating an account or applying as a café partner.</li>
            <li>One personal account per person. Your City Card and taste profile are tied to that account.</li>
            <li>You&apos;re responsible for anything that happens under your account. Tell us if you think it&apos;s been compromised.</li>
          </ul>

          <h2>3. The Match % firewall</h2>
          <p>This is contractual, not just a design principle:</p>
          <ul>
            <li>Payment can never increase, decrease, or otherwise influence a café&apos;s Match % for any user.</li>
            <li>Payment can only affect inclusion in promotional surfaces — placement, features, and City Card eligibility.</li>
            <li>A spot in anyone&apos;s top 3 is ordered by fit alone. Awards are decided by real head-to-head results; unpaid cafés are eligible and do win them.</li>
          </ul>
          <p>
            If we ever break this, we&apos;ve broken the one thing that makes this app worth trusting over a review
            site — tell us at <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a> if you think we
            have.
          </p>

          <h2>4. The City Card</h2>
          <p>
            One personal loyalty card per member, not tied to any single café. Any drink at any partner café earns
            a visit; a max of 2 visits may come from the same café per card, so a completed card always spans at
            least 3 different cafés. Five visits unlock one free item at any partner café. Visits expire after 90
            days of inactivity. Partner cafés cover the cost of redemptions — there is no cost to members, ever.
          </p>

          <h2>5. Café partners</h2>
          <p>
            Founding terms, pricing tiers, and the free-trial agreement for Calgary cafés are set out in full on
            our <Link href="/for-cafes">For Cafés</Link> page, and any signed onboarding agreement governs alongside
            these terms. In summary: no café pays during the Calgary launch trial, regardless of tier; the trial
            runs through July 31, 2027, after which locked, previously-agreed pricing applies with 30 days&apos;
            notice before the first invoice.
          </p>

          <h2>6. Acceptable use</h2>
          <ul>
            <li>No scraping the site or its café data.</li>
            <li>No fake accounts, fake reviews, or manipulating City Card redemptions.</li>
            <li>No using café contact information gathered here for unrelated marketing.</li>
          </ul>

          <h2>7. Disclaimers</h2>
          <p>
            Match percentages are estimates based on self-reported taste data and, where used, real café profiles —
            they are not a guarantee you&apos;ll enjoy a specific café. Café data shown in the current product demo
            is illustrative sample data for real Calgary businesses and does not represent a verified taste
            profile, an endorsement, or a partnership with those businesses.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            Brew and the City is provided as-is. To the extent permitted by Alberta law, we aren&apos;t liable for
            indirect or consequential damages arising from your use of the service. Nothing here limits liability
            where the law doesn&apos;t allow it to be limited.
          </p>

          <h2>9. Changes to these terms</h2>
          <p>
            We&apos;ll post updates here with a new &ldquo;last updated&rdquo; date, and email active members ahead
            of any change that materially affects their rights once accounts exist for real.
          </p>

          <h2>10. Governing law</h2>
          <p>These terms are governed by the laws of Alberta, Canada.</p>

          <h2>11. Contact</h2>
          <p><a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a></p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
