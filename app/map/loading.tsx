import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

// /map's Server Component computes real matches (getMatchesForUser) or
// loads every match-ready café before it can render anything — heavier
// than the other app routes, which mostly delegate their data fetch to a
// client component that already shows its own "Loading…" state instantly.
// Without this, that server-side work showed nothing at all in the
// meantime. Next's loading.tsx convention wraps the route automatically —
// no changes needed to app/map/page.tsx itself.
export default function MapLoading() {
  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div className="label eyebrow">Map</div>
          <h1 style={{ fontSize: 30, marginBottom: 16 }}>Map view</h1>
          <p style={{ color: 'var(--whisk)' }}>Loading cafés…</p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
