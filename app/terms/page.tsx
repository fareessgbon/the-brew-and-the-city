import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms — Brew and the City',
  description: 'The terms for using the Brew and the City pre-launch site — the waitlist and the two surveys.',
  alternates: { canonical: '/terms' },
};

// §0.4 — this site has no accounts, no matching, and no City Card, so the
// full product terms don't apply yet. Covers only the waitlist and surveys.
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        <section style={{ padding: '56px 0 8px' }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="label" style={{ color: 'var(--whisk)', marginBottom: 10 }}>
              Legal
            </div>
            <h1 style={{ fontSize: 38 }}>Terms</h1>
            <div style={{ color: 'var(--whisk)', fontSize: 13, marginTop: 10 }}>
              Last updated August 2026 · Brew and the City, Calgary, Alberta
            </div>
          </div>
        </section>

        <section className="legal" style={{ padding: '24px 0 72px' }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <p>
              This is a pre-launch page for a product still in development. There is no account, no app, and nothing
              to sign up for beyond an email address on the waitlist and two optional surveys. See our{' '}
              <Link href="/privacy">Privacy Policy</Link> for what we collect.
            </p>

            <h2>1. What this site is</h2>
            <p>
              brewandthecity.com currently hosts a landing page, a Founding Partner pitch for Calgary cafés, and two
              short surveys. It does not provide café matching, a loyalty program, or any live product — those are
              planned features, not things you can use today.
            </p>

            <h2>2. The waitlist</h2>
            <p>
              Joining the waitlist commits you to nothing and costs nothing. It is not an account and does not
              guarantee early access, though we intend to notify waitlist members first at launch.
            </p>

            <h2>3. The surveys</h2>
            <p>
              Survey responses are used to shape the product before it&apos;s built — pricing, reward structure, and
              which features matter. Submitting the café partner survey is not an application and creates no
              obligation on either side; Founding Partner terms, if you&apos;re later invited to one of the first 15
              spots, will be set out in a separate written agreement before anything is binding.
            </p>

            <h2>4. Acceptable use</h2>
            <ul>
              <li>No scraping this site.</li>
              <li>No fake or automated survey submissions.</li>
              <li>No using contact information gathered here for unrelated marketing.</li>
            </ul>

            <h2>5. Disclaimers</h2>
            <p>
              Pricing, timelines, and features described on this site (including on the <Link href="/for-cafes">For Cafés</Link>{' '}
              page) are current plans, not commitments — they may change based on what the surveys and further research
              turn up.
            </p>

            <h2>6. Governing law</h2>
            <p>These terms are governed by the laws of Alberta, Canada.</p>

            <h2>7. Contact</h2>
            <p>
              <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
