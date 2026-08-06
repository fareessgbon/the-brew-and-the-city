import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — Brew and the City',
  description: "What Brew and the City collects, why, how long it's kept, and how to see or delete it.",
};

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
            Last updated August 3, 2026 · Brew and the City, Calgary, Alberta
          </div>
        </div>
      </section>

      <section className="legal" style={{ padding: '24px 0 72px' }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="notice-box">
            <strong>This site is currently a demo.</strong> The account, taste-quiz, and café-application forms on
            this site run mostly in your browser — your taste vector and quiz answers are saved to your browser&apos;s
            local storage, and submitted forms are delivered to us for follow-up. The sections below also describe,
            honestly and in advance, what the full production product will collect once it launches — so you know
            what you&apos;re agreeing to before that&apos;s true, not after.
          </div>

          <h2>1. Who we are</h2>
          <p>
            Brew and the City is a Calgary, Alberta café-matching service. This policy covers both the current demo
            and the production product it describes. Questions or requests:{' '}
            <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>.
          </p>

          <h2>2. What this demo collects today</h2>
          <table>
            <tbody>
              <tr>
                <th>Data</th>
                <th>Where it goes</th>
              </tr>
              <tr>
                <td>Name, email, taste-quiz answers, go-to café, your 7-dimension taste vector</td>
                <td>Saved to your browser&apos;s local storage, and delivered to us so we can follow up by email.</td>
              </tr>
              <tr>
                <td>Café name, contact email, neighbourhood, Instagram handle (café application form)</td>
                <td>Delivered to us so we can follow up about onboarding.</td>
              </tr>
            </tbody>
          </table>
          <p>You can clear your local browser data for this site at any time through your browser&apos;s settings.</p>

          <h2>3. What the full product will collect</h2>
          <p>
            Alberta&apos;s <em>Personal Information Protection Act</em> (PIPA) applies to Brew and the City once it
            operates for real, and this section is written to that standard in advance.
          </p>
          <ul>
            <li><strong>Account information</strong> — name, email, and anything you choose to add to your profile.</li>
            <li><strong>Taste profile</strong> — your quiz answers and any edits you make to Your Taste. You can see and change it any time; it&apos;s never a black box.</li>
            <li><strong>Location</strong> — only the current point you&apos;re searching from, used to compute proximity. We do not build a location history.</li>
            <li><strong>Receipt photos</strong> — used only to verify a City Card visit. Visible to you, the café you visited, and admin — never public, never any other user. Deleted automatically 30 days after the redemption is resolved.</li>
            <li><strong>Café application details</strong> — for café owners applying as partners, the business and contact information you submit.</li>
          </ul>

          <h2>4. The Match % firewall</h2>
          <p>
            Café Match % is calculated the same way for every visitor, whether or not a café pays us anything.
            Paying can affect visibility and promotion; it can never affect a café&apos;s Match % for any user. See
            our <a href="/terms">Terms of Service</a> for this as a binding commitment, not just a design choice.
          </p>

          <h2>5. Café Insights and aggregate data</h2>
          <p>
            Partner cafés see aggregate performance stats about the matches sent their way — never a specific
            customer. Any report is suppressed rather than shown if it would cover fewer than 10 people.
          </p>

          <h2>6. Your rights</h2>
          <p>Under PIPA, you can:</p>
          <ul>
            <li><strong>Access and export</strong> your profile, taste vector, City Card visit history, and matchups as a JSON file, on request.</li>
            <li><strong>Correct</strong> anything about your profile that&apos;s wrong — most of it you can edit yourself.</li>
            <li>
              <strong>Delete your account</strong>, self-serve from your profile page — immediate, permanent
              deletion of your profile, email, location data, and any receipt images, with no waiting period. Where
              your history is baked into a café&apos;s aggregate stats, we anonymise rather than delete the
              underlying record.
            </li>
          </ul>

          <h2>7. Cookies and analytics</h2>
          <p>
            This site does not currently run any tracking or analytics scripts. If that changes, anything
            non-essential will be off by default, disclosed here first, and require your opt-in.
          </p>

          <h2>8. Changes to this policy</h2>
          <p>
            If this policy changes materially, we&apos;ll post the update here with a new &ldquo;last updated&rdquo;
            date and, once accounts exist for real, email active members ahead of the change taking effect.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions, access requests, or deletion requests: <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>.
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
