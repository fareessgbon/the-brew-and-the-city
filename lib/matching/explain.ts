import { LABELS, type ContextKey, type Dim } from './constants';
import type { TasteVector } from './vectors';

const CONTEXT_REASONS: Record<ContextKey, string> = {
  study: 'Quiet enough for studying.',
  date: 'The kind of room that works for a date.',
  quick: 'In and out — good for a quick fix.',
  catchup: 'Lively enough to catch up over.',
};

export function contextReason(context: ContextKey | null | undefined): string | null {
  if (!context) return null;
  return CONTEXT_REASONS[context];
}

// Picks the single dimension the user and café agree on most, scoped to
// dims the user actually answered — same scoping rule as tasteFit, so the
// reason given can't reference something nobody was ever asked about.
export function tasteReason(
  userVector: TasteVector,
  cafeVector: TasteVector,
  dims: readonly Dim[],
): string | null {
  if (dims.length === 0) return null;
  const best = [...dims]
    .map((k) => ({ k, agree: 100 - Math.abs(userVector[k] - cafeVector[k]) }))
    .sort((a, b) => b.agree - a.agree)[0];
  const pole = userVector[best.k] >= 50 ? 'high' : 'low';
  return `Matches your ${LABELS[best.k][pole]} preference.`;
}

export function proximityReason(distanceKm: number, radiusKm: number): string | null {
  if (distanceKm <= 1.0) return 'Right around the corner.';
  if (distanceKm <= radiusKm) return 'Within your travel radius.';
  return null;
}
