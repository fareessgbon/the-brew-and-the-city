import { DIMS, PRIMARY_DRINK_CATEGORIES, isValidVector, type Dim, type PrimaryDrinkCategory, type TasteVector } from '@/lib/matching';

export const QUIZ_PROGRESS_KEY = 'mm_quiz_progress';
const TTL_MS = 30 * 60 * 1000;

interface QuizProgress {
  vector: TasteVector;
  answeredDims: Dim[];
  primaryDrinkCategory: PrimaryDrinkCategory | null;
  expiresAt: number;
}

// localStorage, not sessionStorage — a magic-link email commonly opens in a
// new tab/window, which doesn't share sessionStorage with the tab that
// started signup. localStorage is shared across tabs for the same origin.
// The expiry keeps a stale, long-abandoned attempt from resurfacing weeks
// later in a browser that never cleared it.
export function saveQuizProgress(vector: TasteVector, answeredDims: readonly Dim[], primaryDrinkCategory: PrimaryDrinkCategory | null) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    QUIZ_PROGRESS_KEY,
    JSON.stringify({ vector, answeredDims, primaryDrinkCategory, expiresAt: Date.now() + TTL_MS }),
  );
}

export function readQuizProgress(): { vector: TasteVector; answeredDims: Dim[]; primaryDrinkCategory: PrimaryDrinkCategory | null } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(QUIZ_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizProgress>;

    if (typeof parsed.expiresAt !== 'number' || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(QUIZ_PROGRESS_KEY);
      return null;
    }
    if (!isValidVector(parsed.vector)) return null;
    const answeredDims = Array.isArray(parsed.answeredDims) ? parsed.answeredDims.filter((d): d is Dim => DIMS.includes(d as Dim)) : [];
    const primaryDrinkCategory = PRIMARY_DRINK_CATEGORIES.includes(parsed.primaryDrinkCategory as PrimaryDrinkCategory)
      ? (parsed.primaryDrinkCategory as PrimaryDrinkCategory)
      : null;

    return { vector: parsed.vector, answeredDims, primaryDrinkCategory };
  } catch {
    return null;
  }
}

export function clearQuizProgress() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(QUIZ_PROGRESS_KEY);
}
