import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CafeCard } from '@/components/CafeCard';
import { AppNav } from '@/components/AppNav';
import { UndoRejectButton } from '@/components/UndoRejectButton';
import { createClient } from '@/lib/supabase/server';
import { scoreCafeForProfile } from '@/lib/server/getMatchesForUser';
import { assertOnboarded } from '@/lib/server/requireOnboarded';
import type { OpeningHours } from '@/lib/cafeHours';

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/saved');
  await assertOnboarded(supabase, user.id);

  const [{ data: saved }, { data: profile }, { data: rejected }] = await Promise.all([
    supabase.from('saved_cafes').select('cafe_id, cafes(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('taste_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('cafe_feedback')
      .select('cafe_id, cafes(id, name, neighbourhood)')
      .eq('user_id', user.id)
      .eq('feedback', 'not_it')
      .order('created_at', { ascending: false }),
  ]);

  const cafes = (saved ?? [])
    .map((row) => row.cafes)
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((cafe) => {
      const scored = profile ? scoreCafeForProfile(profile, cafe) : null;
      return {
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        neighbourhood: cafe.neighbourhood,
        address: cafe.address,
        openingHours: cafe.opening_hours as OpeningHours | null,
        distanceKm: scored?.distanceMetres != null ? scored.distanceMetres / 1000 : null,
        pct: scored?.match.totalScore,
        reason: scored?.match.reasons[0] ?? null,
      };
    });

  const rejectedCafes = (rejected ?? []).map((row) => row.cafes).filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <AppNav current="/saved" />
          <div className="label eyebrow">City List</div>
          <h1 style={{ fontSize: 30, marginBottom: 24 }}>Cafés you want to try</h1>
          {cafes.length === 0 ? (
            <p style={{ color: 'var(--whisk)' }}>
              Nothing on deck yet — <Link href="/discover">browse cafés</Link> and save a few.
            </p>
          ) : (
            cafes.map((cafe) => <CafeCard key={cafe.id} cafe={cafe} saved signedIn />)
          )}

          {rejectedCafes.length > 0 ? (
            <div style={{ marginTop: 40 }}>
              <div className="label eyebrow" style={{ marginBottom: 12 }}>
                Marked &ldquo;Not for me&rdquo; ({rejectedCafes.length})
              </div>
              {rejectedCafes.map((cafe) => (
                <div
                  key={cafe.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--whisk-10)' }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{cafe.name}</span>
                    {cafe.neighbourhood ? <span style={{ color: 'var(--whisk)', fontSize: 13 }}> — {cafe.neighbourhood}</span> : null}
                  </div>
                  <UndoRejectButton cafeId={cafe.id} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
