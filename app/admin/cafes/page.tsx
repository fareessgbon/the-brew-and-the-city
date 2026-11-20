import type { Metadata } from 'next';
import Link from 'next/link';
import { isAdminSession } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { CafeListClient, type CafeListRow } from '@/components/CafeListClient';
import { DIMS, isUnscored, missingEssentials, workRemaining, type City, type Dim } from '@/lib/data/cafeFields';

export const metadata: Metadata = {
  title: 'Cafés — Brew and the City',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// The working list for entering café records by hand. Sorted by how much
// each row still needs rather than alphabetically: this page exists to be
// worked through, and the café missing its coordinates is the one you want
// at the top, not the one whose name starts with A.
export default async function AdminCafesPage() {
  if (!(await isAdminSession())) {
    return <AdminLoginForm />;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('cafes')
    .select(
      'id, name, slug, city, neighbourhood, latitude, longitude, verified_at, partner_status, updated_at, ' +
        DIMS.map((d) => `${d}_score`).join(', '),
    )
    // Archived cafés (see the DELETE route) are off the working list, the
    // same way soft-deleted survey rows are off the queue.
    .eq('is_active', true)
    .order('name');

  const cafes = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    city: string;
    neighbourhood: string | null;
    latitude: number | null;
    longitude: number | null;
    verified_at: string | null;
    partner_status: string;
    updated_at: string;
  } & Record<`${Dim}_score`, number>>;

  // Real scores are only needed to compute the sort rank and the unscored
  // flag — both happen here, before the lighter CafeListRow (no raw scores)
  // goes to the client component.
  const ranked = cafes
    .map((c) => {
      const scores = DIMS.reduce((acc, d) => ({ ...acc, [d]: c[`${d}_score`] }), {} as Record<Dim, number>);
      const row: CafeListRow = {
        id: c.id,
        name: c.name,
        slug: c.slug,
        // See lib/data/cafeFields.ts's City type comment on the [id] page —
        // same check-constraint-backed cast.
        city: c.city as City,
        neighbourhood: c.neighbourhood,
        partner_status: c.partner_status,
        verified_at: c.verified_at,
        updated_at: c.updated_at,
        missing: missingEssentials(c),
        unscored: isUnscored(scores),
      };
      return { row, rank: workRemaining({ ...c, scores }) };
    })
    .sort((a, b) => b.rank - a.rank || a.row.name.localeCompare(b.row.name));

  const sorted = ranked.map((r) => r.row);
  const verified = sorted.filter((c) => c.verified_at !== null).length;
  const complete = sorted.filter((c) => c.missing.length === 0 && !c.unscored && c.verified_at !== null).length;

  return (
    <div className="wrap admin-page">
      <div className="admin-bar" style={{ marginBottom: 28 }}>
        <div>
          <div className="label eyebrow">
            <Link href="/admin" className="admin-card-link">
              Admin
            </Link>{' '}
            / Cafés
          </div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Cafés</h1>
          <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
            {cafes.length === 0
              ? 'Nothing here yet — add the first café.'
              : `${cafes.length} listed · ${complete} launch-ready · ${verified} verified in person.`}
          </p>
        </div>
        <Link href="/admin/cafes/new" className="btn btn-primary" style={{ flex: 'none', width: 'auto' }}>
          Add a café
        </Link>
      </div>

      {/* The homepage's sample-data disclaimer is driven by exactly this
          number, so it belongs on the page where it gets changed — not
          buried in app/page.tsx where nobody entering data would find it. */}
      {cafes.length > 0 && verified < cafes.length ? (
        <div className="admin-card" style={{ marginBottom: 18 }}>
          <div className="admin-metric-label">Sample-data disclaimer</div>
          <p style={{ fontSize: 13.5, marginTop: 6, marginBottom: 0 }}>
            The homepage still tells visitors its cafés are placeholders, and will until every listed
            café is marked verified in person. {cafes.length - verified} to go.
          </p>
        </div>
      ) : null}

      <section className="admin-section" style={{ marginTop: 0 }}>
        <CafeListClient cafes={sorted} />
      </section>

      <p style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 28 }}>
        Every café carries a {DIMS.length}-dimension taste vector. A dim left at 50 reads as “no call
        made”, which is what matching falls back to anyway — so leaving one alone costs nothing, and
        guessing costs a bad match.
      </p>
    </div>
  );
}
