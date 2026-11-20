import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { type DiscoverCafe } from '@/components/DiscoverContent';
import { DiscoverComingSoon } from '@/components/DiscoverComingSoon';
import { AccountDashboard } from '@/components/AccountDashboard';
import { createAdminClient, createSessionClient } from '@/lib/supabase/server';
import { NEUTRAL_VECTOR, PRIMARY_DRINK_CATEGORIES, type Dim, type PrimaryDrinkCategory } from '@/lib/matching';
import { getTasteProfile } from '@/lib/server/tasteProfile';
import { todaysQueue } from '@/lib/server/todaysPick';
import { qualifyingStamps, STAMPS_REQUIRED } from '@/lib/server/cityCard';

export const metadata: Metadata = pageMetadata({
  title: 'Discover Cafés — Brew and the City',
  description: 'Browse every café in the Brew and the City network, filter by what you drink, and see how each one matches your taste.',
  canonical: '/discover',
});

// Signed-in-only content, but not a hard gate any more (see chat, and the
// now-deleted proxy.ts) — sign-in itself is still fresh enough that it
// shouldn't be the first thing cold traffic hits, so a signed-out visitor
// gets DiscoverComingSoon (waitlist CTA, no login prompt) instead of a
// redirect. /login stays fully reachable by direct URL for continued
// testing; nothing public links to it right now. The café query only runs
// once there's an actual signed-in visitor to show it to.
export default async function DiscoverPage() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return (
      <>
        <SiteHeader current="discover" />
        <main id="content">
          <DiscoverComingSoon />
        </main>
        <SiteFooter />
      </>
    );
  }

  // The visitor's city (set by CityProvider) scopes the whole dashboard —
  // list, map, Today's Pick, City List. No cookie yet means no scoping, so a
  // first visit still shows something rather than an empty page.
  const cityCookie = (await cookies()).get('city')?.value;
  const city = cityCookie === 'calgary' || cityCookie === 'toronto' ? cityCookie : null;

  const supabase = createAdminClient();
  let query = supabase
    .from('cafes')
    .select(
      'id, name, slug, neighbourhood, verified_at, drink_categories, drink_score, energy_score, aesthetic_score, pace_score, adventure_score, price_score, food_score',
    )
    .eq('is_active', true);
  if (city) query = query.eq('city', city);
  const { data } = await query.order('name');

  const cafes: DiscoverCafe[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    area: c.neighbourhood ?? 'Neighbourhood TBD',
    drinkCategories: (c.drink_categories ?? []).filter((cat): cat is PrimaryDrinkCategory =>
      (PRIMARY_DRINK_CATEGORIES as readonly string[]).includes(cat),
    ),
    vector: {
      drink: c.drink_score,
      energy: c.energy_score,
      aesthetic: c.aesthetic_score,
      pace: c.pace_score,
      adventure: c.adventure_score,
      price: c.price_score,
      food: c.food_score,
    },
  }));

  // Your Taste — server-persisted (taste_profiles). No row yet just means
  // this account hasn't saved from the editor before; AccountDashboard
  // falls back to whatever's in localStorage from the homepage quiz (see
  // lib/localTaste.ts) rather than a bare neutral vector, so someone who
  // quizzed before signing in doesn't lose that on their first visit here.
  const profile = await getTasteProfile(session, user.id);
  const taste = profile?.vector ?? null;
  const answeredDims: Dim[] = profile?.answeredDims ?? [];

  const [{ data: saved }, { data: visitRows }, { data: activeReward }] = await Promise.all([
    session.from('saved_cafes').select('cafe_id').eq('user_id', user.id),
    session.from('visits').select('id, cafe_id, status, created_at, reward_id').eq('user_id', user.id).order('created_at', { ascending: false }),
    session.from('rewards').select('code').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
  ]);

  const savedCafeIds = (saved ?? []).map((s) => s.cafe_id);
  const visits = visitRows ?? [];
  const cafeNameById = new Map(cafes.map((c) => [c.id, c.name]));

  const approvedUnconsumed = visits.filter((v) => v.status === 'approved' && v.reward_id === null);
  const stamps = qualifyingStamps(approvedUnconsumed).length;

  // Today's Pick — ranked, excluding anything already on the City List.
  // §8.1's "or dismissed" half of the exclusion is client-side (today's
  // passes live in lib/localDismissals.ts, not the server); TodayPickCard
  // walks this queue skipping whatever it finds dismissed today.
  const queue = todaysQueue(user.id, cafes, taste ?? NEUTRAL_VECTOR, answeredDims, new Set(savedCafeIds));

  return (
    <>
      <SiteHeader current="discover" />
      <main id="content">
        <AccountDashboard
          cafes={cafes}
          accountEmail={user.email ?? 'your account'}
          memberSince={user.created_at ?? null}
          taste={taste}
          answeredDims={answeredDims}
          savedCafeIds={savedCafeIds}
          todaysQueue={queue}
          cityCard={{
            stamps,
            stampsRequired: STAMPS_REQUIRED,
            activeReward: activeReward ?? null,
            history: visits.map((v) => ({
              id: v.id,
              cafeName: cafeNameById.get(v.cafe_id) ?? 'Unknown café',
              status: v.status,
              createdAt: v.created_at,
            })),
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
