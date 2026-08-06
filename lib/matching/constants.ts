// Every adjustable matching value lives here, and only here — nothing in
// taste-fit.ts / context-fit.ts / proximity-fit.ts / score.ts should hardcode
// a number that could reasonably need tuning later.

export const DIMS = [
  'drink',
  'energy',
  'aesthetic',
  'pace',
  'adventure',
  'price',
  'food',
] as const;

export type Dim = (typeof DIMS)[number];

// §7.1a — categorical, not a vector axis. Sits beside the 7-dim taste
// vector rather than as a point on it: "coffee vs. matcha" and "sweet vs.
// bold" answer different questions.
export const PRIMARY_DRINK_CATEGORIES = ['coffee', 'matcha', 'tea_chai', 'refreshers_other'] as const;
export type PrimaryDrinkCategory = (typeof PRIMARY_DRINK_CATEGORIES)[number];

export const PRIMARY_DRINK_CATEGORY_LABELS: Record<PrimaryDrinkCategory, string> = {
  coffee: 'Coffee',
  matcha: 'Matcha',
  tea_chai: 'Tea or chai',
  refreshers_other: 'Refreshers and other drinks',
};

export const WEIGHTS: Record<Dim, number> = {
  drink: 1.3,
  energy: 1.2,
  aesthetic: 1.0,
  pace: 1.1,
  adventure: 0.8,
  price: 1.0,
  food: 0.7,
};

export const LABELS: Record<Dim, { low: string; high: string }> = {
  drink: { low: 'sweet, milky drinks', high: 'strong, unsweetened drinks' },
  energy: { low: 'quiet spaces', high: 'lively, social rooms' },
  aesthetic: { low: 'minimal, restrained rooms', high: 'cosy, maximal rooms' },
  pace: { low: 'in-and-out visits', high: 'lingering for hours' },
  adventure: { low: 'the classics done well', high: 'rotating seasonal drinks' },
  price: { low: 'keeping it under $5', high: 'not flinching at $9+' },
  food: { low: 'drink-only visits', high: 'serious pastry cases' },
};

// §1 — "what you need, right now": deep work, a date, a quick fix, catching
// up. Context fit is scored on energy/pace only — the two dims that actually
// determine whether a room works for what someone's there to do.
export const CONTEXTS = ['study', 'date', 'quick', 'catchup'] as const;
export type ContextKey = (typeof CONTEXTS)[number];

export const CONTEXT_TARGETS: Record<ContextKey, { energy: number; pace: number; label: string }> = {
  study: { energy: 20, pace: 85, label: 'Deep work' },
  date: { energy: 45, pace: 60, label: 'A date' },
  quick: { energy: 50, pace: 10, label: 'A quick fix' },
  catchup: { energy: 65, pace: 50, label: 'Catching up' },
};

export const CONTEXT_WEIGHTS = {
  energy: 1.0,
  pace: 1.2,
};

// §7.4a — plateau to 1km, exponential decay after.
export const PROXIMITY_PLATEAU_KM = 1.0;
export const PROXIMITY_TAU_SUMMER_KM = 5.0;

// §1.5 — Calgary winter kills walk-up discovery: shrink the decay tau Nov–Mar
// so distance is weighted more heavily and a great café across town doesn't
// quietly bury a decent one nearby once it's -20°C outside.
export const PROXIMITY_WINTER_MULTIPLIER = 0.6;
export const WINTER_MONTHS: readonly number[] = [11, 12, 1, 2, 3]; // 1-indexed, Nov–Mar

// Final score is clamped to this range — never 0 (nothing is a "0% match"
// to anyone) and never 100 (nothing is guaranteed).
export const SCORE_MIN = 40;
export const SCORE_MAX = 98;

// How taste / context / proximity combine into the total. Note there is no
// weight for partner/paid status here — see score.ts for why that's not a
// bug, it's the point.
export const SCORE_WEIGHTS = {
  taste: 0.45,
  context: 0.25,
  proximity: 0.3,
};
