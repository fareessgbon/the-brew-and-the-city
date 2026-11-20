import { scoreCafes, type ScorableCafe, type ScoredCafe } from '@/lib/scoreCafes';
import type { ContextKey, Dim, TasteVector } from '@/lib/matching';

// §8.1 — "single card, served once per day, highest-scoring café the user
// hasn't visited or dismissed." The real spec runs this as a 7am cron and
// caches the result; there's no scheduler in this environment, so it's a
// pure function instead — same order all day for the same user because the
// inputs (date + taste + exclusions) don't change until the next date, but
// nothing is written to a table to get that stability.
//
// Returns a full ranked queue, not just one café: "Not it" needs a next
// candidate without a round trip, and dismissals for today
// (lib/localDismissals.ts) are client-only, so the server can't know which
// entries to skip in advance. The client walks this list, skipping
// whatever's already been dismissed today.
function dateSeed(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD, local-enough for a daily pick
}

// A small deterministic hash so two different users (or the same user on
// two different days) don't all land on the same café when scores tie —
// without it, an unscored/neutral-vector visitor would see the same
// alphabetically-first café every single day.
function seededIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

export function todaysQueue<T extends ScorableCafe>(
  userId: string,
  cafes: readonly T[],
  taste: TasteVector,
  answeredDims: readonly Dim[],
  excludeIds: ReadonlySet<string>,
  now: Date = new Date(),
): (T & ScoredCafe)[] {
  const candidates = cafes.filter((c) => !excludeIds.has(c.id));
  if (candidates.length === 0) return [];

  const scored = scoreCafes(candidates, taste, answeredDims, null as ContextKey | null);

  // No real answers yet: every score is the same neutral-vector baseline,
  // so "highest-scoring first" is meaningless order — rotate the list by a
  // date+user seed instead of always starting from the query's first row.
  if (answeredDims.length === 0) {
    const offset = seededIndex(`${userId}:${dateSeed(now)}`, scored.length);
    return [...scored.slice(offset), ...scored.slice(0, offset)];
  }

  return scored;
}
