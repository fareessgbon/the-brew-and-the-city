import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Brew and the City',
  description: "What Brew and the City's pre-launch site collects, why, and how to have it removed.",
};

// §0.4 — deliberately short. This site collects a waitlist email and two
// optional surveys, nothing else; the full privacy policy the real product
// needs (location, receipt photos, accounts) doesn't apply yet because
// none of those features exist at this stage.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0 8px' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 10 }}>
            Legal
          </div>
          <h1 style={{ fontSize: 38 }}>Privacy Policy</h1>
          <div style={{ color: 'var(--whisk)', fontSize: 13, marginTop: 10 }}>
            Last updated August 2026 · Brew and the City, Calgary, Alberta
          </div>
        </div>
      </section>

      <section className="legal" style={{ padding: '24px 0 72px' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="notice-box">
            <strong>This is a pre-launch page, not the product.</strong> There is no account, no app, and no café
            data yet — just a waitlist and two short surveys. This policy covers only what that actually collects.
            A fuller policy will replace this one once the real product exists.
          </div>

          <h2>1. Who we are</h2>
          <p>
            Brew and the City is a Calgary, Alberta café-matching product currently in development. Questions or
            requests: <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>.
          </p>

          <h2>2. What this site collects</h2>
          <table>
            <tbody>
              <tr>
                <th>Where</th>
                <th>What&apos;s collected</th>
                <th>Why</th>
              </tr>
              <tr>
                <td>Waitlist (&ldquo;Join the list&rdquo;)</td>
                <td>Email address only</td>
                <td>To notify you when the product launches</td>
              </tr>
              <tr>
                <td>Café partner survey</td>
                <td>Café name, contact name, email, city/area, Instagram or website, and your answers to the survey questions</td>
                <td>To follow up about becoming a Founding Partner, and to shape what we build</td>
              </tr>
              <tr>
                <td>Consumer survey</td>
                <td>Your answers only — no name or email is collected</td>
                <td>To shape what we build; responses aren&apos;t tied to you</td>
              </tr>
            </tbody>
          </table>
          <p>Nothing else is collected. There is no location tracking, no analytics, and no cookies beyond what your browser needs to load the page.</p>

          <h2>3. How long it&apos;s kept</h2>
          <p>
            Waitlist emails and survey responses are kept until the product launches or, if it doesn&apos;t, no
            longer than 12 months from submission — whichever comes first.
          </p>

          <h2>4. Your rights</h2>
          <p>
            Under Alberta&apos;s <em>Personal Information Protection Act</em> (PIPA), you can ask us what we hold
            about you and ask us to delete it. Email{' '}
            <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a> — waitlist removal is immediate;
            survey responses submitted anonymously (the consumer survey) can&apos;t be matched back to a specific
            person to delete individually, since we never collected anything identifying in the first place.
          </p>

          <h2>5. Changes to this policy</h2>
          <p>If this changes, we&apos;ll post the update here with a new &ldquo;last updated&rdquo; date.</p>

          <h2>6. Contact</h2>
          <p>
            <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
