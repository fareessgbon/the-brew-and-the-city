const KEY = 'mm_dismissed_v1';

interface StoredDismissal {
  cafeId: string;
  date: string; // YYYY-MM-DD
}

// Today's Pick's "Not it" — same client-only pattern as lib/localVisits.ts.
// §8.1 specs 90 days of server-side suppression; this is a deliberate
// simplification (see the plan) that only suppresses for the rest of the
// calendar day the pass happened on, tracked in this browser only.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): StoredDismissal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is StoredDismissal => typeof d === 'object' && d !== null && typeof (d as StoredDismissal).cafeId === 'string' && typeof (d as StoredDismissal).date === 'string',
    );
  } catch {
    return [];
  }
}

export function loadDismissedToday(): Set<string> {
  const t = today();
  return new Set(load().filter((d) => d.date === t).map((d) => d.cafeId));
}

export function dismissForToday(cafeId: string): Set<string> {
  const t = today();
  // Drop stale (previous-day) entries on write so the list can't grow
  // forever — it never needs to remember more than "today"'s passes.
  const next = load().filter((d) => d.date === t);
  next.push({ cafeId, date: t });
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked — the pass still applies for this render.
    }
  }
  return new Set(next.map((d) => d.cafeId));
}
