import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { JobApplicationForm } from '@/components/JobApplicationForm';
import { ROLES, getRole } from '@/lib/data/roles';

export const dynamicParams = false;

export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return { title: 'Apply — Brew and the City' };
  return {
    title: `Apply · ${role.title} — Brew and the City`,
    description: `Apply for the ${role.title} role at Brew and the City. One short form, no account, no résumé portal.`,
    alternates: { canonical: `/careers/${role.slug}/apply` },
    // The posting is the page worth ranking; this is its form. Indexing
    // both splits the same role across two results.
    robots: { index: false, follow: true },
  };
}

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  return (
    <>
      <SiteHeader current="careers" />
      <main id="content">
        <section style={{ padding: '48px 0' }}>
          <div className="wrap">
            {/* Same 640 column as the survey forms, so the heading sits flush
                with the form's edges instead of spanning the full wrap. */}
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="eyebrow label">Careers · Application</div>
              <h1 style={{ fontSize: 30, marginBottom: 8 }}>{role.title}</h1>
              <p style={{ fontSize: 15, color: 'var(--whisk)', marginBottom: 8 }}>
                About five minutes. Your name, email, a resume — the file or a link to it — and a link to something
                you&apos;ve made are the required fields; the rest helps, but a blank box won&apos;t cost you the
                role.
              </p>
              <p style={{ fontSize: 14, color: 'var(--whisk)', marginBottom: 24 }}>
                Haven&apos;t read the posting yet?{' '}
                <Link href={`/careers/${role.slug}`}>Go back to the role</Link>{' '}
                — it says what this is, what it isn&apos;t, and what it pays.
              </p>
              <JobApplicationForm roleSlug={role.slug} roleTitle={role.title} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
