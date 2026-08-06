'use client';

import Link from 'next/link';

// Root error boundary — catches unhandled errors thrown during rendering and
// from Server Actions anywhere that doesn't have a more specific error.tsx
// of its own (e.g. the admin console's guarded deleteCafe, or a Supabase
// call that fails). Without this, those errors fell through to Next's
// default, unstyled crash screen.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section style={{ padding: '64px 0' }}>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="label" style={{ marginBottom: 8, color: 'var(--error, #A8503F)' }}>
          Something went wrong
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>That didn&apos;t work.</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14.5, marginBottom: 20 }}>{error.message || 'An unexpected error occurred.'}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
