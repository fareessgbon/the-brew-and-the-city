'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

// Root error boundary — catches unhandled errors thrown during rendering and
// from Server Actions anywhere that doesn't have a more specific error.tsx
// of its own (e.g. the admin console's guarded deleteCafe, or a Supabase
// call that fails). Without this, those errors fell through to Next's
// default, unstyled crash screen.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      {/* Was a bare section with no nav — a visitor who hit this had no way
          onward except the browser's back button, on the one screen where
          they most need one. */}
      <SiteHeader />
      <main id="content">
        <section style={{ padding: '64px 0' }}>
          <div className="wrap" style={{ maxWidth: 560 }}>
            <div className="label" style={{ marginBottom: 8, color: 'var(--error, #A8503F)' }}>
              Something went wrong
            </div>
            <h1 style={{ fontSize: 26, marginBottom: 12 }}>That didn&apos;t work.</h1>
            {/* error.message used to be printed here. Next redacts messages
                thrown on the server, but a client-side error arrives intact
                — so a visitor could be shown a stack-shaped string naming
                internals, which tells them nothing and us nothing. The
                digest is what support can actually trace. */}
            <p style={{ color: 'var(--whisk)', fontSize: 14.5, marginBottom: 20 }}>
              Something broke on our end, not yours. Try again — if it keeps happening, email{' '}
              <a href="mailto:hello@brewandthecity.com">hello@brewandthecity.com</a> and we&apos;ll sort it out.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-primary" onClick={() => reset()}>
                Try again
              </button>
              <Link href="/" className="btn btn-ghost">
                Go home
              </Link>
            </div>
            {error.digest ? (
              <p style={{ color: 'var(--whisk)', fontSize: 12, marginTop: 20 }}>Reference: {error.digest}</p>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
