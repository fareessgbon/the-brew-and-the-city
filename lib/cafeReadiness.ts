import type { Database } from '@/lib/supabase/types';

type CafeRow = Database['public']['Tables']['cafes']['Row'];

// A café can look fully seeded (taste scores always default to 50 on
// insert) without actually being ready to recommend — no real address, no
// coordinates, nobody's confirmed the vector in person. Recommending it
// anyway is exactly the "removes proximity, still ranks highly" failure
// mode this guards against. is_match_ready is the explicit admin switch;
// the rest are the concrete fields a genuinely ready café must actually have.
export function isCafeMatchReady(cafe: CafeRow): boolean {
  return (
    cafe.is_match_ready === true &&
    cafe.verified_at != null &&
    cafe.latitude != null &&
    cafe.longitude != null &&
    !!cafe.address &&
    !!cafe.neighbourhood &&
    cafe.opening_hours != null &&
    Object.keys(cafe.opening_hours as Record<string, unknown>).length > 0
  );
}

export function missingReadinessFields(cafe: CafeRow): string[] {
  const missing: string[] = [];
  if (!cafe.is_match_ready) missing.push('marked match-ready');
  if (!cafe.verified_at) missing.push('verified in person');
  if (cafe.latitude == null || cafe.longitude == null) missing.push('coordinates');
  if (!cafe.address) missing.push('address');
  if (!cafe.neighbourhood) missing.push('neighbourhood');
  if (!cafe.opening_hours || Object.keys(cafe.opening_hours as Record<string, unknown>).length === 0) missing.push('opening hours');
  return missing;
}
