import { CONTEXT_TARGETS, CONTEXT_WEIGHTS, type ContextKey } from './constants';
import type { TasteVector } from './vectors';

// How well a café suits what you need *right now* — deep work, a date, a
// quick fix, catching up — independent of whether you'd generally like the
// place. A perfect flavour match with no seats and a line out the door is
// still a bad call if you need to work, so this is scored separately from
// taste, not folded into it.
export function contextFit(cafeVector: TasteVector, context: ContextKey | null | undefined): number {
  if (!context) return 100; // no stated need — don't penalize anything

  const target = CONTEXT_TARGETS[context];
  let d = 0;
  let dMax = 0;

  d += CONTEXT_WEIGHTS.energy * (cafeVector.energy - target.energy) ** 2;
  dMax += CONTEXT_WEIGHTS.energy * 10000;

  d += CONTEXT_WEIGHTS.pace * (cafeVector.pace - target.pace) ** 2;
  dMax += CONTEXT_WEIGHTS.pace * 10000;

  return 100 * (1 - Math.sqrt(d) / Math.sqrt(dMax));
}
