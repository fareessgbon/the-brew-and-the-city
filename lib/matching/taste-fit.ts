import { DIMS, WEIGHTS, type Dim } from './constants';
import type { TasteVector } from './vectors';

// Weighted-Euclidean similarity between a user's taste vector and a café's,
// scored 0–100. Restricting to `dims` matters: if a quiz only asked about 3
// of the 7 dimensions, the other 4 sit at a neutral default for every user
// and must not be scored — otherwise a café whose real aesthetic/adventure/
// price/food happens to sit far from neutral gets silently penalized for
// something nobody was ever asked about.
export function tasteFit(
  userVector: TasteVector,
  cafeVector: TasteVector,
  dims: readonly Dim[] = DIMS,
): number {
  if (dims.length === 0) return 50; // no signal on any dim — stay neutral

  let d = 0;
  let dMax = 0;
  for (const k of dims) {
    const w = WEIGHTS[k];
    d += w * (userVector[k] - cafeVector[k]) ** 2;
    dMax += w * 10000; // worst case: 100-point gap on every scored dim
  }
  if (dMax === 0) return 100;
  return 100 * (1 - Math.sqrt(d) / Math.sqrt(dMax));
}
