import { createClient } from '@/lib/supabase/server';
import { calculateMatch, DIMS, isWithinRadius, type ContextKey, type Dim, type MatchResult } from '@/lib/matching';
import { distanceMetresOrNull } from '@/lib/location/distance';
import { isCafeMatchReady } from '@/lib/cafeReadiness';
import { isOpenNow, type OpeningHours } from '@/lib/cafeHours';
import type { Database } from '@/lib/supabase/types';

type CafeRow = Database['public']['Tables']['cafes']['Row'];
type TasteProfileRow = Database['public']['Tables']['taste_profiles']['Row'];

export interface CafeMatch {
  cafe: CafeRow;
  distanceMetres: number | null;
  match: MatchResult;
  openNow: boolean | null;
}

export interface UserMatches {
  inRadius: CafeMatch[];
  /** Strong matches outside the radius, shown only when the profile has
   * worth_the_trip set — never mixed into inRadius. */
  worthTheTrip: CafeMatch[];
}

// A "worth the trip" pick has to actually be exceptional, not just the best
// of a weak outside-radius field — this is a deliberate, high bar.
const WORTH_THE_TRIP_MIN_SCORE = 90;
const WORTH_THE_TRIP_MAX_RESULTS = 3;

// The one place calculateMatch() actually gets called for real (signed-in)
// users. Every page that shows a match % should go through either this or
// scoreCafeForProfile() below — not call tasteFit()/calculateMatch()
// directly — so context, proximity, and the winter weighting can't silently
// drop out again in some new call site.
export function scoreCafeForProfile(profile: TasteProfileRow, cafe: CafeRow, context: ContextKey | null = null): CafeMatch {
  const distanceMetres = distanceMetresOrNull(profile.home_latitude, profile.home_longitude, cafe.latitude, cafe.longitude);
  const answeredDims = (profile.answered_dims.length > 0 ? profile.answered_dims : DIMS) as Dim[];
  const userProfile = DIMS.reduce((acc, dim) => {
    acc[dim] = profile[dim];
    return acc;
  }, {} as Record<Dim, number>);

  const match = calculateMatch({
    userProfile,
    cafeProfile: {
      drink: cafe.drink_score,
      energy: cafe.energy_score,
      aesthetic: cafe.aesthetic_score,
      pace: cafe.pace_score,
      adventure: cafe.adventure_score,
      price: cafe.price_score,
      food: cafe.food_score,
    },
    answeredDims,
    context,
    distanceMetres,
    month: new Date().getMonth() + 1,
    radiusKm: profile.radius_km,
  });

  return { cafe, distanceMetres, match, openNow: isOpenNow(cafe.opening_hours as OpeningHours | null) };
}

function sortByOpenThenScore(a: CafeMatch, b: CafeMatch): number {
  if (a.openNow !== b.openNow) return a.openNow ? -1 : 1;
  return b.match.totalScore - a.match.totalScore;
}

// Recommendation surfaces (/today, /discover, /map): every match-ready café
// (real coordinates, address, neighbourhood, hours, admin-verified — see
// lib/cafeReadiness.ts), scored, with the "not it" hard filter applied.
// Radius splits results into two separate groups rather than one filtered
// list — see UserMatches. NOT used for /saved or /cafes/[slug] — a café you
// explicitly saved, or navigated to directly, shouldn't vanish just because
// it's outside your current radius, incomplete, or was marked "not it" on
// some other visit.
export async function getMatchesForUser(userId: string, context: ContextKey | null = null): Promise<UserMatches> {
  const supabase = await createClient();

  const { data: profile } = await supabase.from('taste_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (!profile) return { inRadius: [], worthTheTrip: [] };

  const [{ data: cafes }, { data: feedback }, { data: attributes }] = await Promise.all([
    supabase.from('cafes').select('*').order('name'),
    supabase.from('cafe_feedback').select('cafe_id').eq('user_id', userId).eq('feedback', 'not_it'),
    supabase.from('cafe_attributes').select('*'),
  ]);

  const notItIds = new Set((feedback ?? []).map((f) => f.cafe_id));
  const attributesByCafe = new Map((attributes ?? []).map((a) => [a.cafe_id, a]));

  // §7.2 hard filters — a café failing any of these is excluded outright,
  // not down-ranked. A café with no cafe_attributes row yet (real dietary/
  // accessibility data hasn't been collected) fails any requirement rather
  // than passing it by default — an unverified "yes" on step-free access or
  // gluten-free is worse than the café quietly not showing up yet.
  function passesRequirements(cafeId: string): boolean {
    if (!profile!.needs_non_dairy && !profile!.needs_gluten_free && !profile!.needs_wheelchair) return true;
    const attrs = attributesByCafe.get(cafeId);
    if (!attrs) return false;
    if (profile!.needs_non_dairy && !attrs.oat) return false;
    if (profile!.needs_gluten_free && !attrs.gluten_free) return false;
    if (profile!.needs_wheelchair && !attrs.wheelchair) return false;
    return true;
  }

  const scored = (cafes ?? [])
    .filter((cafe) => !notItIds.has(cafe.id) && isCafeMatchReady(cafe))
    .filter((cafe) => !profile.primary_drink_category || cafe.drink_categories.includes(profile.primary_drink_category))
    .filter((cafe) => passesRequirements(cafe.id))
    .map((cafe) => scoreCafeForProfile(profile, cafe, context));

  // A café with an unknown distance hasn't been shown to be outside the
  // radius — only exclude ones we can actually measure as too far.
  const inRadius = scored
    .filter(({ distanceMetres }) => distanceMetres === null || isWithinRadius(distanceMetres, profile.radius_km))
    .sort(sortByOpenThenScore);

  let worthTheTrip: CafeMatch[] = [];
  if (profile.worth_the_trip) {
    worthTheTrip = scored
      .filter(({ distanceMetres }) => distanceMetres !== null && !isWithinRadius(distanceMetres, profile.radius_km))
      .filter(({ match }) => match.totalScore >= WORTH_THE_TRIP_MIN_SCORE)
      .sort((a, b) => b.match.totalScore - a.match.totalScore)
      .slice(0, WORTH_THE_TRIP_MAX_RESULTS);
  }

  return { inRadius, worthTheTrip };
}
