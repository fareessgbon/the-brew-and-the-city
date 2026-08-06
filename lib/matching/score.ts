import { DIMS, SCORE_MAX, SCORE_MIN, SCORE_WEIGHTS, type ContextKey, type Dim } from './constants';
import { contextFit } from './context-fit';
import { contextReason, proximityReason, tasteReason } from './explain';
import { proximityFit } from './proximity-fit';
import { tasteFit } from './taste-fit';
import type { TasteVector } from './vectors';

export interface CalculateMatchInput {
  userProfile: TasteVector;
  cafeProfile: TasteVector;
  /** What the visitor is there for right now. Omit if unknown. */
  context?: ContextKey | null;
  /** Pass null when neither the user's nor the café's real coordinates are
   * known yet — most cafés don't have lat/lng until step 10's geocoding
   * lands. A missing distance is scored as "unknown," not as "0m" or
   * "infinitely far": proximity drops out of the blend entirely rather than
   * silently helping or hurting a café based on data that doesn't exist. */
  distanceMetres: number | null;
  /** 1–12 (January = 1), used for the winter proximity decay. */
  month: number;
  /** Which taste dims the user has actually answered. Defaults to all 7. */
  answeredDims?: readonly Dim[];
  /** The visitor's own stated travel radius, for the proximity reason text. */
  radiusKm?: number;
}

export interface MatchResult {
  totalScore: number;
  tasteScore: number;
  /** null when no context was given — not scored as a free 100. */
  contextScore: number | null;
  /** null when distanceMetres was null — no proximity component was scored. */
  proximityScore: number | null;
  reasons: string[];
}

// §5.1 — the firewall. Paid/partner status can change whether a café is
// promoted or surfaced; it must never change a café's Match %. That's
// enforced structurally here, not just by convention: CalculateMatchInput
// has no field for partner status, price paid, or any promotional flag, so
// there is nothing for this function to read even if a caller wanted it to.
// See lib/matching/__tests__/score.test.ts for the test that pins this down.
export function calculateMatch(input: CalculateMatchInput): MatchResult {
  const {
    userProfile,
    cafeProfile,
    context = null,
    distanceMetres,
    month,
    answeredDims = DIMS,
    radiusKm = Infinity,
  } = input;

  const distanceKm = distanceMetres === null ? null : distanceMetres / 1000;

  const tasteScore = Math.round(tasteFit(userProfile, cafeProfile, answeredDims));
  const contextScore = context === null ? null : Math.round(contextFit(cafeProfile, context));
  const proximityScore = distanceKm === null ? null : Math.round(proximityFit(distanceKm, month));

  // Blend only the components that actually have a real value behind them.
  // No context selected, or no distance known, means that component drops
  // out of the weighted average entirely — it is never scored as a free 100
  // (context) or a silent 0m/∞ (proximity); the remaining weights are
  // renormalized to still sum to 1.
  const components: { score: number; weight: number }[] = [{ score: tasteScore, weight: SCORE_WEIGHTS.taste }];
  if (contextScore !== null) components.push({ score: contextScore, weight: SCORE_WEIGHTS.context });
  if (proximityScore !== null) components.push({ score: proximityScore, weight: SCORE_WEIGHTS.proximity });

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const rawTotal = components.reduce((sum, c) => sum + (c.weight / totalWeight) * c.score, 0);
  const totalScore = Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(rawTotal)));

  const reasons = [
    contextScore === null ? null : contextReason(context),
    tasteReason(userProfile, cafeProfile, answeredDims),
    distanceKm === null ? null : proximityReason(distanceKm, radiusKm),
  ].filter((reason): reason is string => reason !== null);

  return { totalScore, tasteScore, contextScore, proximityScore, reasons };
}

export function isWithinRadius(distanceMetres: number, radiusKm: number): boolean {
  return distanceMetres / 1000 <= radiusKm;
}

// A café outside the visitor's stated travel radius is excluded entirely,
// not just scored lower — matching §7.4a, radius is a hard filter, not
// another input to the decay curve.
export function filterWithinRadius<T extends { distanceMetres: number }>(
  cafes: readonly T[],
  radiusKm: number,
): T[] {
  return cafes.filter((cafe) => isWithinRadius(cafe.distanceMetres, radiusKm));
}
