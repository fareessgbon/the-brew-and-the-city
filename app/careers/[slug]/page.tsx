import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ROLES, getRole, type RoleSection } from '@/lib/data/roles';

// Only the roles in ROLES exist — dynamicParams:false makes any other slug
// a 404 at the routing layer instead of rendering, so a stale link to a
// closed posting can't resolve to a half-empty page.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return { title: 'Careers — Brew and the City' };
  // Its own social card: this is the page that gets pasted into a DM or a
  // job group, where the homepage's consumer headline says nothing about
  // the role being offered.
  return pageMetadata({
    title: `${role.title} — ${role.company}`,
    description: role.blurb,
    canonical: `/careers/${role.slug}`,
  });
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="forcafe-list" style={{ margin: '10px 0 22px' }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// A section's groups — "Content", "On location", "Logistics" and so on.
// The group heading is display serif while the section heading above it is
// mono uppercase, so the two levels are told apart by typeface rather than
// by size alone, which at these sizes wouldn't read as a hierarchy at all.
function SectionGroups({ sections }: { sections: RoleSection[] }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {sections.map((section, i) => (
        <div key={section.heading} style={{ marginTop: i === 0 ? 18 : 22 }}>
          <h3 className="role-group-head">{section.heading}</h3>
          <BulletList items={section.items} />
        </div>
      ))}
    </div>
  );
}

export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  const applyHref = `/careers/${role.slug}/apply`;

  return (
    <>
      <SiteHeader current="careers" />
      <main id="content">

        <section style={{ padding: '48px 0 8px' }}>
          <div className="wrap" style={{ maxWidth: 720 }}>
            <Link href="/careers" style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
              ← All open roles
            </Link>

            <h1 style={{ fontSize: 36, lineHeight: 1.12, letterSpacing: '-0.02em', margin: '16px 0 14px' }}>
              {role.title}
            </h1>
            <div className="role-meta">
              <span>{role.company}</span>
              <span>{role.location}</span>
              <span>{role.commitment}</span>
              <span>{role.compensation}</span>
            </div>

            {/* Leads the posting, ahead of the company paragraph — someone
                who clicked a job title deserves to know what the days
                actually look like before they read what we are. */}
            <p className="role-hook" style={{ margin: '22px 0 0', fontSize: 24 }}>
              {role.hook}
            </p>

            {/* Answers the question the hook plants — who's paying for all
                that coffee — before the reader has to go looking for it in
                the terms block. */}
            <p className="role-perk">{role.perk}</p>

            {role.intro.map((paragraph) => (
              <p key={paragraph} style={{ fontSize: 16.5, color: 'var(--ink)', margin: '18px 0 0', maxWidth: '60ch' }}>
                {paragraph}
              </p>
            ))}

            <Link href={applyHref} className="btn btn-primary" style={{ width: 'auto', display: 'inline-block', marginTop: 24 }}>
              Apply for this role
            </Link>
          </div>
        </section>

        <section style={{ padding: '32px 0 48px' }}>
          <div className="wrap" style={{ maxWidth: 720 }}>
            <div className="section-eyebrow label">What you&apos;ll do</div>
            <SectionGroups sections={role.responsibilities} />

            <div className="section-eyebrow label">Qualifications</div>
            <p style={{ fontSize: 15.5, color: 'var(--ink)', margin: '0', maxWidth: '60ch' }}>
              {role.lookingForIntro}
            </p>
            <SectionGroups sections={role.lookingFor} />

            {role.benefits && (
              <>
                <div className="section-eyebrow label">What you&apos;ll get</div>
                <BulletList items={role.benefits} />
              </>
            )}

            {/* The terms sit in their own bordered block rather than as another
                bullet list — pay and schedule are the facts most likely to
                decide someone either way, and they shouldn't be the ninth
                line of a list they've stopped reading by. */}
            <div className="notice-box" style={{ marginBottom: 28 }}>
              <strong>Commitment and pay.</strong> {role.terms}
            </div>

            <div className="club-band">
              <div className="section-eyebrow label">Interested?</div>
              <h2 style={{ fontSize: 24, marginBottom: 12 }}>{role.closing}</h2>
              <p style={{ fontSize: 15, color: 'var(--paper)', opacity: 0.85, margin: '0 0 18px', maxWidth: '56ch' }}>
                Send us your resume and a portfolio, or just examples of content and design work you&apos;ve made.
                Links are fine — a TikTok account you run counts as a portfolio here.
              </p>
              <Link href={applyHref} className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                Apply for this role
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
