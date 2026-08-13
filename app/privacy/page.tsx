import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy — Brew and the City',
  description: "What Brew and the City's pre-launch site collects, why, and how to have it removed.",
  canonical: '/privacy',
});

// §0.4 — deliberately short. This site collects a waitlist email and two
// optional surveys, nothing else; the full privacy policy the real product
// needs (location, receipt photos, accounts) doesn't apply yet because
// none of those features exist at this stage.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
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
              data yet — just a waitlist, two short surveys, and a job application form. This policy covers only what
              those actually collect. A fuller policy will replace this one once the real product exists.
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
                {/* Kept in step with components/WaitlistForm.tsx. The form
                    gained an optional first name and go-to cafés (migration
                    0025); "email address only" was true before that and is
                    not any more, so this row has to say so. */}
                <tr>
                  <td>Waitlist (&ldquo;Join the list&rdquo;)</td>
                  <td>
                    Your email address, plus a first name and your go-to cafés if you choose to add them — both are
                    optional and the list works without them
                  </td>
                  <td>To notify you when the product launches, and to know which cafés to have ready on day one</td>
                </tr>
                <tr>
                  <td>Café partner survey</td>
                  <td>Café name, contact name, email, city/area, Instagram or website, and your answers to the survey questions</td>
                  <td>To follow up about becoming a Founding Partner, and to shape what we build</td>
                </tr>
                <tr>
                  <td>Consumer survey</td>
                  <td>Your name, your answers to the survey questions, and your email if you choose to give it</td>
                  <td>To shape what we build, and to follow up if you left an email</td>
                </tr>
                {/* Kept in step with components/JobApplicationForm.tsx. A
                    resume is the most sensitive thing this site holds — it's
                    a file someone wrote about themselves, not a form field —
                    so it's named explicitly rather than folded into "your
                    application". */}
                <tr>
                  <td>Job application (&ldquo;Careers&rdquo;)</td>
                  <td>
                    Your name, email and your resume — either the file you upload or the link you give us — plus
                    anything else you choose to add: phone number, whether you&apos;re in Calgary and can travel for
                    shoots, links to your work, your availability and written answers
                  </td>
                  <td>To consider you for the role you applied to, and to reply to you about it</td>
                </tr>
              </tbody>
            </table>
            <p>Nothing else is collected. There is no location tracking, no analytics, and no cookies beyond what your browser needs to load the page.</p>

            <h2>3. How long it&apos;s kept</h2>
            <p>
              Waitlist entries and survey responses are kept until the product launches or, if it doesn&apos;t, no
              longer than 12 months from submission — whichever comes first.
            </p>
            <p>
              Job applications, including any uploaded resume, are kept for 12 months from the date you applied, so we
              can come back to you if a role opens that fits better than the one you applied for. Ask us sooner and
              we&apos;ll delete both the application and the file.
            </p>
            <p>
              Uploaded resumes are stored privately. They are not published anywhere, not linked from any public page,
              and not readable by anyone with the file&apos;s address — the only way to open one is a temporary link
              generated for us when we review your application. If you gave us a link instead of a file, we only
              store the link; whatever it points to stays wherever you host it, under your own sharing settings.
            </p>

            <h2>4. Your rights</h2>
            <p>
              Under Alberta&apos;s <em>Personal Information Protection Act</em> (PIPA), you can ask us what we hold
              about you and ask us to delete it. Email{' '}
              <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a> — waitlist removal is immediate,
              and so is deleting a job application and any resume you uploaded with it. For a consumer survey
              response, email us from the address you gave — or, if you left that blank, tell us the name you used
              and roughly when you submitted — and we&apos;ll find the response and delete it.
            </p>

            <h2>5. Changes to this policy</h2>
            <p>If this changes, we&apos;ll post the update here with a new &ldquo;last updated&rdquo; date.</p>

            <h2>6. Contact</h2>
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
