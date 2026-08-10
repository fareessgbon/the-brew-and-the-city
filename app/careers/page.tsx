import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ROLES } from '@/lib/data/roles';

export const metadata: Metadata = {
  title: 'Careers — Brew and the City',
  description:
    'We’re building a café-discovery platform in Calgary, and we’re small enough that one person’s work is visible in the product. Here’s what’s open.',
  alternates: { canonical: '/careers' },
};

// §0.4 holds here too: no account, no login, no résumé portal. A role page,
// then one form. Every fact a candidate needs to self-select out — pay,
// location, commitment — is on the card before they click, not three pages
// deep, which is the whole reason those three fields are required on Role.
export default function CareersPage() {
  return (
    <>
      <SiteHeader current="careers" />
      <main id="content">

        <section style={{ padding: '56px 0 8px' }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="eyebrow label">Careers</div>
            <h1 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Small team, real ownership, a city we actually care about.
            </h1>
            <p style={{ fontSize: 17, color: 'var(--ink)', maxWidth: '60ch', margin: '0 0 14px' }}>
              Brew and the City is a discovery platform for independent cafés — matching people to cafés by taste
              rather than by review count, starting in Calgary. We&apos;re pre-launch, which means nothing here is a
              finished machine you&apos;d be a cog in. The work is visible: what you make goes out under the brand,
              and you&apos;ll know exactly which part was yours.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', maxWidth: '60ch', margin: 0 }}>
              We hire the way we approach cafés — honestly, and without wasting your time. Everything you need to
              decide whether a role is worth applying for is on the posting, including whether it pays.
            </p>
          </div>
        </section>

        <section style={{ padding: '32px 0 56px' }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <div className="section-eyebrow label">Open roles</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {ROLES.map((role) => (
                <div key={role.slug} className="ratio-box">
                  <h2 style={{ fontSize: 22, marginBottom: 6 }}>
                    {/* Whole card would be a nicer target, but a card-wide
                        link swallows the meta text into the link's accessible
                        name — the title stays the link. */}
                    <Link href={`/careers/${role.slug}`}>{role.title}</Link>
                  </h2>
                  <div className="role-meta">
                    <span>{role.location}</span>
                    <span>{role.commitment}</span>
                    <span>{role.compensation}</span>
                  </div>
                  {/* The hook, not the blurb — the blurb is written for a
                      search result, where this line would have no page around
                      it to land against. */}
                  <p className="role-hook" style={{ margin: '14px 0 16px' }}>
                    {role.hook}
                  </p>
                  <Link
                    href={`/careers/${role.slug}`}
                    className="btn btn-primary"
                    style={{ width: 'auto', display: 'inline-block' }}
                  >
                    Read the role
                  </Link>
                </div>
              ))}
            </div>

            <div className="ratio-box" style={{ marginTop: 24 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Nothing here fits?
              </div>
              <p style={{ fontSize: 14.5, color: 'var(--ink)', margin: 0, maxWidth: '58ch' }}>
                We&apos;re a very small team and roles open unpredictably. If you think there&apos;s something you
                could do for Brew and the City that isn&apos;t listed, email{' '}
                <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a>{' '}
                and tell us what it is — a short note with your work attached beats a cover letter.
              </p>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
