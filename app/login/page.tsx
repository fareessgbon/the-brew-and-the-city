import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = pageMetadata({
  title: 'Log In — Brew and the City',
  description: 'Sign in with a magic link to browse Discover.',
  canonical: '/login',
  // A sign-in form isn't a page worth ranking.
  robots: { index: false, follow: true },
});

// The one account gate on the pre-launch site (see chat, proxy.ts) —
// everywhere else still holds to §0.4. `next` carries the page someone was
// turned away from (set by proxy.ts) so the magic link returns them there
// instead of dropping them on a generic landing page.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const nextParam = sp.next;
  const next = typeof nextParam === 'string' && nextParam.startsWith('/') ? nextParam : '/discover';
  const linkExpired = sp.error === 'link-expired';

  const points = [
    { n: '01', t: "Today's Pick — one café a day, with the reasons it matched." },
    { n: '02', t: 'Your City List and Your Taste, saved across devices.' },
    { n: '03', t: 'The City Card — five verified visits, one free item anywhere in the network.' },
  ];

  return (
    <>
      <SiteHeader />
      <main id="content">
        <section className="page-head">
          <div
            className="wrap"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'start' }}
          >
            <div>
              <div className="label eyebrow">Your account</div>
              <h1 className="page-title">
                Welcome back.
              </h1>
              <p className="page-lede" style={{ maxWidth: '42ch' }}>
                Discover is the one part of this pre-launch site that asks for an account — everything else,
                including the homepage quiz, still doesn&apos;t. No password: we email you a link.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--paper-2)', paddingTop: 22, maxWidth: '46ch' }}>
                {points.map((p) => (
                  <div key={p.n} style={{ display: 'flex', gap: 12, fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--whisk)', flex: '0 0 auto' }}>{p.n}</span>
                    <span>{p.t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="discover-card" style={{ padding: 32 }}>
              {linkExpired ? (
                <div className="form-note" style={{ color: 'var(--error, #A8503F)', marginBottom: 16 }}>
                  That link expired or was already used — enter your email again for a new one.
                </div>
              ) : null}
              <LoginForm next={next} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
