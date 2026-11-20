import {
  CONTEXTS,
  DIMS,
  PRIMARY_DRINK_CATEGORIES,
  isValidVector,
  type ContextKey,
  type Dim,
  type PrimaryDrinkCategory,
  type TasteVector,
} from '@/lib/matching';

const KEY = 'mm_taste_v1';

export interface PersistedTaste {
  vector: TasteVector;
  answeredDims: Dim[];
  primaryDrinkCategory: PrimaryDrinkCategory | null;
  context: ContextKey | null;
}

// Client-only, same-device persistence for the homepage quiz's own answers
// — no account behind it (§0.4): nothing here leaves localStorage, there's
// no server call, and clearing site data forgets it completely. Exists so a
// visitor's real match scores can follow them from the homepage quiz to
// /discover instead of resetting to neutral on every navigation.
export function loadTasteState(): PersistedTaste | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!isValidVector(parsed.vector)) return null;
    const answeredDims = Array.isArray(parsed.answeredDims)
      ? parsed.answeredDims.filter((d): d is Dim => DIMS.includes(d as Dim))
      : [];
    const primaryDrinkCategory = PRIMARY_DRINK_CATEGORIES.includes(parsed.primaryDrinkCategory as PrimaryDrinkCategory)
      ? (parsed.primaryDrinkCategory as PrimaryDrinkCategory)
      : null;
    const context = CONTEXTS.includes(parsed.context as ContextKey) ? (parsed.context as ContextKey) : null;
    return { vector: parsed.vector, answeredDims, primaryDrinkCategory, context };
  } catch {
    return null;
  }
}

export function saveTasteState(state: PersistedTaste): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private browsing) — the quiz still works
    // in-memory for this visit, it just won't follow the visitor to
    // another page. Not worth surfacing as an error.
  }
}

export function clearTasteState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // See saveTasteState.
  }
}
