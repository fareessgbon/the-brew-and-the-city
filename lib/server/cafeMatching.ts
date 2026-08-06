import { createClient } from '@/lib/supabase/server';
import { getMatchesForUser } from '@/lib/server/getMatchesForUser';
import { isCafeMatchReady } from '@/lib/cafeReadiness';
import { isFeatureEnabled } from '@/lib/server/featureFlags';
import type { OpeningHours } from '@/lib/cafeHours';

export interface CafeWithOptionalMatch {
  id: string;
  name: string;
  slug: string;
  neighbourhood: string | null;
  address: string | null;
  openingHours: OpeningHours | null;
  distanceMetres?: number | null;
  pct?: number;
  reason?: string | null;
  oat: boolean;
  glutenFree: boolean;
  wheelchair: boolean;
}

// Shared by /discover — fetches every café, and if the current visitor is
// signed in with a saved taste profile, scores each one through the same
// getMatchesForUser() service /today and /cafes/[slug] use (taste + context
// + real proximity + winter weighting + radius + "not it" exclusion).
export async function getCafesForVisitor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let savedIds = new Set<string>();
  let hasProfile = false;
  if (user) {
    const [{ data: saved }, { data: profile }] = await Promise.all([
      supabase.from('saved_cafes').select('cafe_id').eq('user_id', user.id),
      supabase.from('taste_profiles').select('onboarding_completed').eq('user_id', user.id).maybeSingle(),
    ]);
    savedIds = new Set((saved ?? []).map((s) => s.cafe_id));
    hasProfile = !!profile?.onboarding_completed;
  }

  const { data: attributes } = await supabase.from('cafe_attributes').select('*');
  const attrsByCafe = new Map((attributes ?? []).map((a) => [a.cafe_id, a]));

  // §11 matching_feed — server-checked, not just hidden in the UI. Disabled
  // means everyone sees the same plain, unranked café list a signed-out
  // visitor already gets, not an error state.
  const matchingFeedEnabled = await isFeatureEnabled('matching_feed');

  if (user && hasProfile && matchingFeedEnabled) {
    const { inRadius } = await getMatchesForUser(user.id);
    const results: CafeWithOptionalMatch[] = inRadius.map(({ cafe, distanceMetres, match }) => {
      const attrs = attrsByCafe.get(cafe.id);
      return {
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        neighbourhood: cafe.neighbourhood,
        address: cafe.address,
        openingHours: cafe.opening_hours as OpeningHours | null,
        distanceMetres,
        pct: match.totalScore,
        reason: match.reasons[0] ?? null,
        oat: attrs?.oat ?? false,
        glutenFree: attrs?.gluten_free ?? false,
        wheelchair: attrs?.wheelchair ?? false,
      };
    });
    return { cafes: results, savedIds, signedIn: true, hasProfile: true };
  }

  const { data: cafes } = await supabase.from('cafes').select('*').order('name');
  const results: CafeWithOptionalMatch[] = (cafes ?? []).filter(isCafeMatchReady).map((cafe) => {
    const attrs = attrsByCafe.get(cafe.id);
    return {
      id: cafe.id,
      name: cafe.name,
      slug: cafe.slug,
      neighbourhood: cafe.neighbourhood,
      address: cafe.address,
      openingHours: cafe.opening_hours as OpeningHours | null,
      oat: attrs?.oat ?? false,
      glutenFree: attrs?.gluten_free ?? false,
      wheelchair: attrs?.wheelchair ?? false,
    };
  });

  return { cafes: results, savedIds, signedIn: !!user, hasProfile };
}
