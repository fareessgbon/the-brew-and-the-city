import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AppNav } from '@/components/AppNav';
import { CafeMap, type MapCafe } from '@/components/map/CafeMap';
import { createClient } from '@/lib/supabase/server';
import { getMatchesForUser } from '@/lib/server/getMatchesForUser';
import { isCafeMatchReady } from '@/lib/cafeReadiness';
import { isFeatureEnabled } from '@/lib/server/featureFlags';

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userLocation: { latitude: number; longitude: number } | null = null;
  let mapCafes: MapCafe[] = [];
  let hasProfile = false;
  // §11 matching_feed — server-checked; disabled falls back to the same
  // plain, unranked pin list a signed-out visitor already sees below.
  const matchingFeedEnabled = await isFeatureEnabled('matching_feed');

  if (user) {
    const { data: profile } = await supabase.from('taste_profiles').select('*').eq('user_id', user.id).maybeSingle();
    hasProfile = !!profile?.onboarding_completed;
    // An account stuck mid-onboarding gets sent back to finish it; a
    // visitor who hasn't signed up at all can still browse the map.
    if (!hasProfile) redirect('/onboarding');
    if (profile?.home_latitude != null && profile?.home_longitude != null) {
      userLocation = { latitude: profile.home_latitude, longitude: profile.home_longitude };
    }
    if (profile && matchingFeedEnabled) {
      const { inRadius, worthTheTrip } = await getMatchesForUser(user.id);
      mapCafes = [...inRadius, ...worthTheTrip].map((m) => ({
        id: m.cafe.id,
        name: m.cafe.name,
        slug: m.cafe.slug,
        neighbourhood: m.cafe.neighbourhood,
        latitude: m.cafe.latitude,
        longitude: m.cafe.longitude,
        pct: m.match.totalScore,
      }));
    }
  }

  const { count: totalCafes } = await supabase.from('cafes').select('id', { count: 'exact', head: true });

  if (!hasProfile || !matchingFeedEnabled) {
    const { data: cafes } = await supabase.from('cafes').select('*').order('name');
    mapCafes = (cafes ?? []).filter(isCafeMatchReady).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      neighbourhood: c.neighbourhood,
      latitude: c.latitude,
      longitude: c.longitude,
    }));
  }

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <AppNav current="/map" />
          <div className="label eyebrow">Map</div>
          <h1 style={{ fontSize: 30, marginBottom: 16 }}>Map view</h1>

          {mapCafes.length < (totalCafes ?? 0) ? (
            <div className="notice-box" style={{ marginBottom: 24 }}>
              {mapCafes.length} of {totalCafes}{' '}
              cafés are match-ready right now (real coordinates, address, neighbourhood, hours, and admin-verified)
              — incomplete ones are held back from recommendations rather than shown without real proximity or
              hours. Finish a café&apos;s details in the admin dashboard to bring it in.
            </div>
          ) : null}

          {mapCafes.length === 0 ? (
            <p style={{ color: 'var(--whisk)' }}>No match-ready cafés yet.</p>
          ) : (
            <CafeMap cafes={mapCafes} userLocation={userLocation} />
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
