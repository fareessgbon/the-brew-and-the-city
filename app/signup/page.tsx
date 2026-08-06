import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { safeInternalPath } from '@/lib/safeRedirect';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = { title: 'Create an account — Brew and the City' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = safeInternalPath(next, '/onboarding');

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '72px 0' }}>
        <div className="wrap" style={{ maxWidth: 480 }}>
          <div className="label eyebrow">Create an account</div>
          <h1 style={{ fontSize: 34, marginBottom: 12 }}>Save your Taste for good.</h1>
          <p style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 32 }}>
            Free, always. Pick a password so your Taste and matches are here next time you open the site.
          </p>
          <SignupForm nextPath={nextPath} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
