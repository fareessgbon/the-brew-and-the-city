const KEY = 'mm_visits_v1';

/** Café slug → number of times this visitor has marked themselves as having been there. */
export type VisitCounts = Record<string, number>;

// Same account-free, same-device pattern as lib/localTaste.ts — a personal
// "cafés I've been to" log with nothing behind it but this browser's
// storage. Deliberately not the real product's `visits` table (migration
// 0001), which is keyed to a real auth.users account via public.users —
// this is a lighter, honest stand-in for a phase that has no accounts at
// all (§0.4). It's not connected to City Card redemption, which a café
// verifies on their end; this is only ever the visitor's own say-so.
export function loadVisits(): VisitCounts {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: VisitCounts = {};
    for (const [slug, count] of Object.entries(parsed)) {
      if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
        result[slug] = Math.floor(count);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function addVisit(slug: string): VisitCounts {
  const next = loadVisits();
  next[slug] = (next[slug] ?? 0) + 1;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked — the increment still shows for this
      // render via the returned value, it just won't survive a reload.
    }
  }
  return next;
}
