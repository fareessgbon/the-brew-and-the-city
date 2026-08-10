import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

// Matches app/error.tsx's styling — without this, a bad URL fell through to
// Next's bare, unbranded default 404 instead of the rest of the site's look.
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        <section style={{ padding: '64px 0' }}>
          <div className="wrap" style={{ maxWidth: 560 }}>
            <div className="label" style={{ marginBottom: 8, color: 'var(--whisk)' }}>
              Page not found
            </div>
            <h1 style={{ fontSize: 26, marginBottom: 12 }}>We couldn&apos;t find that.</h1>
            <p style={{ color: 'var(--whisk)', fontSize: 14.5, marginBottom: 20 }}>The page you&apos;re looking for doesn&apos;t exist, or may have moved.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/" className="btn btn-primary">
                Go home
              </Link>
              <Link href="/for-cafes" className="btn btn-ghost">
                For cafés
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
