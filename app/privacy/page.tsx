import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy — Brew and the City',
  description: "What Brew and the City's pre-launch site collects, why, and how to have it removed.",
  canonical: '/privacy',
});

// §0.4 — deliberately short. Everything on this site except Discover still
// needs no account: a waitlist email, two optional surveys, and (since
// Discover shipped) a public, read-only look at real Calgary and Toronto cafés. Discover
// itself is a deliberate, narrow exception (see chat) — a real Supabase Auth
// sign-in gates the page, but nothing past that gate (your quiz answers,
// your "I've been here" log) is stored anywhere but your own browser. The
// full privacy policy the real product needs (location, receipt photos,
// friend graphs) still doesn't apply — those features don't exist yet.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        <section className="page-head" style={{ paddingBottom: 8 }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="label eyebrow">
              Legal
            </div>
            <h1 className="page-title">Privacy Policy</h1>
            <div style={{ color: 'var(--whisk)', fontSize: 13, marginTop: 10 }}>
              Last updated September 2026 · Brew and the City, Calgary &amp; Toronto
            </div>
          </div>
        </section>

        <section className="legal" style={{ padding: '24px 0 72px' }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="notice-box">
              <strong>This is a pre-launch page, not the product.</strong> You can browse real Calgary and Toronto cafés and try
              a preview of taste-matching without an account — the waitlist, two short surveys, and a job application
              form all still ask for nothing more than that. The one exception is Discover, which asks you to sign in
              with an email link before you can browse; nothing you do past that point (quiz answers, cafés you mark
              as visited) is stored anywhere but your own browser. This policy covers only what this site actually
              collects. A fuller policy will replace this one once the real product exists.
            </div>

            <h2>1. Who we are</h2>
            <p>
              Brew and the City is a Calgary and Toronto café-matching product currently in development. Questions or
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
                {/* Kept in step with app/login — Supabase Auth's own
                    auth.users table, not the real product's public.users/
                    taste_profiles/saved_cafes/visits (those stay walled off
                    from this pre-launch phase — see supabase/migrations/0021
                    and chat). Nothing past sign-in is server-side at all. */}
                <tr>
                  <td>Discover (&ldquo;Log in&rdquo;)</td>
                  <td>Your email address, to send you a one-time sign-in link. No password.</td>
                  <td>
                    To confirm you&apos;re a real person before showing Discover — your quiz answers and any cafés
                    you mark as visited stay in your browser only, never sent to us
                  </td>
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
                    anything else you choose to add: phone number, which city you&apos;re in and whether you can travel for
                    shoots, links to your work, your availability and written answers
                  </td>
                  <td>To consider you for the role you applied to, and to reply to you about it</td>
                </tr>
              </tbody>
            </table>
            <p>
              Nothing else is collected. There is no location tracking and no analytics. The only cookie beyond what
              your browser needs to load the page is the sign-in cookie Discover sets once you follow an email link —
              it just proves you&apos;re signed in and holds no personal information itself.
            </p>

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
            <p>
              A Discover sign-in is kept until you ask us to delete it — there&apos;s no separate retention clock,
              since the account itself is the only thing on our side; everything it unlocks lives in your browser and
              is already gone the moment you clear site data.
            </p>

            <h2>4. Your rights</h2>
            <p>
              Under Alberta&apos;s <em>Personal Information Protection Act</em> (PIPA), you can ask us what we hold
              about you and ask us to delete it. Email{' '}
              <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a> — waitlist removal is immediate,
              and so is deleting a job application and any resume you uploaded with it. For a consumer survey
              response, email us from the address you gave — or, if you left that blank, tell us the name you used
              and roughly when you submitted — and we&apos;ll find the response and delete it. To delete a Discover
              account, email us from the address you signed in with.
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
