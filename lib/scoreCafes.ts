import { calculateMatch, type ContextKey, type Dim, type TasteVector } from '@/lib/matching';

export interface ScorableCafe {
  id: string;
  vector: TasteVector;
}

export interface ScoredCafe {
  pct: number;
  reasons: string[];
}

// Shared by the homepage quiz's results view and /discover so both score
// cafés the exact same way — distanceMetres stays null in both (no café
// has real coordinates wired into matching yet) and month is real, since
// proximity's winter multiplier is the only thing that reads it.
export function scoreCafes<T extends ScorableCafe>(
  cafes: readonly T[],
  userVector: TasteVector,
  answeredDims: readonly Dim[],
  context: ContextKey | null,
): (T & ScoredCafe)[] {
  const month = new Date().getMonth() + 1;
  return cafes
    .map((c) => {
      const result = calculateMatch({
        userProfile: userVector,
        cafeProfile: c.vector,
        context,
        distanceMetres: null,
        month,
        answeredDims,
      });
      return { ...c, pct: result.totalScore, reasons: result.reasons };
    })
    .sort((a, b) => b.pct - a.pct);
}
