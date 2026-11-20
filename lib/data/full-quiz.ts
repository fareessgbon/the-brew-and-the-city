import { CONTEXTS, CONTEXT_TARGETS, type ContextKey, type Dim, type PrimaryDrinkCategory } from '@/lib/matching';

export interface TasteQuizOption {
  label: string;
  sub?: string;
  delta: number;
}

export interface CategoryQuizOption {
  label: string;
  sub?: string;
  value: PrimaryDrinkCategory;
}

export interface CategoryQuizQuestion {
  kind: 'category';
  question: string;
  options: CategoryQuizOption[];
}

export interface TasteQuizQuestion {
  kind: 'taste';
  dim: Dim;
  question: string;
  /** Non-adaptive questions (Q3–Q8). */
  options?: TasteQuizOption[];
  /** Q2 only — same four deltas, wording keyed to Q1's answer (§Appendix A). */
  optionsByCategory?: Record<PrimaryDrinkCategory, TasteQuizOption[]>;
}

export interface RadiusQuizOption {
  label: string;
  sub?: string;
  radiusKm: number;
  worthTrip: boolean;
}

export interface RadiusQuizQuestion {
  kind: 'radius';
  question: string;
  options: RadiusQuizOption[];
}

export interface ContextQuizOption {
  label: string;
  sub?: string;
  value: ContextKey;
}

export interface ContextQuizQuestion {
  kind: 'context';
  question: string;
  options: ContextQuizOption[];
}

export type QuizQuestion = CategoryQuizQuestion | TasteQuizQuestion | RadiusQuizQuestion | ContextQuizQuestion;

export function tasteOptionsFor(question: TasteQuizQuestion, category: PrimaryDrinkCategory | null): TasteQuizOption[] {
  if (question.optionsByCategory) return question.optionsByCategory[category ?? 'coffee'];
  return question.options ?? [];
}

// Q2's wording adapts to Q1's drink category, but every version applies the
// same four deltas in the same order — drink_profile stays comparable
// across coffee, matcha, tea, and refresher drinkers (§7.1a).
const DRINK_PROFILE_BY_CATEGORY: Record<PrimaryDrinkCategory, TasteQuizOption[]> = {
  coffee: [
    { label: 'Sweet and flavoured', sub: 'vanilla, caramel, or mocha', delta: -35 },
    { label: 'A lightly sweetened latte', delta: -10 },
    { label: 'An unsweetened latte or cappuccino', delta: 15 },
    { label: 'Black coffee or straight espresso', delta: 40 },
  ],
  matcha: [
    { label: 'Sweet and flavoured', sub: 'strawberry, vanilla, or coconut', delta: -35 },
    { label: 'A lightly sweetened matcha latte', delta: -10 },
    { label: 'An unsweetened matcha latte', delta: 15 },
    { label: 'Straight matcha or usucha', delta: 40 },
  ],
  tea_chai: [
    { label: 'Sweet and creamy', sub: 'chai, or a flavoured tea latte', delta: -35 },
    { label: 'Lightly sweetened with milk', delta: -10 },
    { label: 'Plain tea with a little milk', delta: 15 },
    { label: 'Straight brewed tea, nothing added', delta: 40 },
  ],
  refreshers_other: [
    { label: 'Sweet and fruity', delta: -35 },
    { label: 'Lightly sweetened and refreshing', delta: -10 },
    { label: 'Tart, citrusy, or sparkling', delta: 15 },
    { label: 'Unsweetened and simple', delta: 40 },
  ],
};

// The full 9-question quiz (Appendix A v3.1): Q1 drink category, Q2
// adaptive drink_profile, Q3–Q8 the remaining six vector dimensions, Q9
// travel radius. The homepage teaser reuses Q1–Q3 so the copy stays
// consistent for anyone who did the teaser first — see lib/data/quiz.ts.
export const FULL_QUIZ: QuizQuestion[] = [
  {
    kind: 'category',
    question: 'What’s your go-to café drink?',
    options: [
      { value: 'coffee', label: 'Coffee', sub: 'espresso, lattes, cappuccinos, cold brew, or filter' },
      { value: 'matcha', label: 'Matcha', sub: 'matcha lattes, flavoured matcha, or traditional' },
      { value: 'tea_chai', label: 'Tea or chai', sub: 'chai lattes, brewed tea, London fogs, or tea lattes' },
      { value: 'refreshers_other', label: 'Refreshers and other drinks', sub: 'fruit refreshers, lemonades, sparkling, or caffeine-free' },
    ],
  },
  {
    kind: 'taste',
    dim: 'drink',
    question: 'How do you usually like your drink?',
    optionsByCategory: DRINK_PROFILE_BY_CATEGORY,
  },
  {
    kind: 'taste',
    dim: 'energy',
    question: 'What kind of room do you want to walk into?',
    options: [
      { label: 'Silent', sub: 'everyone has headphones on', delta: -35 },
      { label: 'A low hum', sub: 'but mostly quiet', delta: -12 },
      { label: 'Busy', sub: 'but I can still hear myself', delta: 15 },
      { label: 'Packed', sub: 'music up and people talking', delta: 38 },
    ],
  },
  {
    kind: 'taste',
    dim: 'pace',
    question: 'How long are you staying?',
    options: [
      { label: 'In and out', sub: 'under ten minutes', delta: -38 },
      { label: 'About half an hour', delta: -12 },
      { label: 'An hour or two', delta: 18 },
      { label: 'Until they start stacking chairs', delta: 40 },
    ],
  },
  {
    kind: 'taste',
    dim: 'aesthetic',
    question: 'What should the café look like?',
    options: [
      { label: 'Concrete, steel, and one plant', delta: -35 },
      { label: 'Light wood, minimal, and Japandi', delta: -12 },
      { label: 'Warm, plants, and mismatched chairs', delta: 18 },
      { label: 'Maximal', sub: 'records, art, and happy clutter', delta: 38 },
    ],
  },
  {
    kind: 'taste',
    dim: 'adventure',
    question: 'How adventurous are you at the counter?',
    options: [
      { label: 'I order the same thing every time', delta: -35 },
      { label: 'I rotate between two or three favourites', delta: -10 },
      { label: 'I choose whatever looks good that day', delta: 15 },
      { label: 'I always try the new seasonal drink', delta: 38 },
    ],
  },
  {
    kind: 'taste',
    dim: 'price',
    question: 'How much is a drink worth to you?',
    options: [
      { label: 'Under $5', sub: 'or I’m making it at home', delta: -38 },
      { label: 'Around $6 feels normal', delta: -10 },
      { label: 'I’ll pay $8 if it’s genuinely good', delta: 18 },
      { label: 'I don’t really check the price', delta: 38 },
    ],
  },
  {
    kind: 'taste',
    dim: 'food',
    question: 'Is food part of the plan?',
    options: [
      { label: 'I’m only here for the drink', delta: -35 },
      { label: 'I might get a pastry', delta: -8 },
      { label: 'The pastry case matters', delta: 20 },
      { label: 'If there’s no real food, I’m not going', delta: 38 },
    ],
  },
  {
    kind: 'radius',
    question: 'How far will you go?',
    options: [
      { label: 'Walking distance only', radiusKm: 1.5, worthTrip: false },
      { label: 'A short drive', sub: 'around ten minutes', radiusKm: 6, worthTrip: false },
      { label: 'Anywhere in the city', radiusKm: 15, worthTrip: false },
      { label: "I'll drive across town for a great café", radiusKm: 25, worthTrip: true },
    ],
  },
];

// A quick one-liner per context, in the same casual voice as the option
// labels above it — not the fuller sentence contextReason() shows on the
// result card, just enough texture for a quiz option to not read as a bare
// category name.
const CONTEXT_SUBS: Record<ContextKey, string | undefined> = {
  study: 'settle in for a while',
  date: undefined,
  quick: 'grab it and go',
  catchup: 'with a friend',
};

// Not part of the real product's Q1–Q9 (Appendix A) — contextFit() in
// lib/matching/context-fit.ts has been sitting fully built and tested with
// nothing ever feeding it a real context, since no quiz question asked for
// one. This is that missing input, added to the homepage teaser rather
// than spliced into FULL_QUIZ, so Appendix A's own numbering stays exactly
// what the spec says it is. Labels come straight from CONTEXT_TARGETS
// rather than being retyped here, so the question and the scoring it
// drives can't drift apart.
export const CONTEXT_QUESTION: ContextQuizQuestion = {
  kind: 'context',
  question: 'What are you here to do?',
  options: CONTEXTS.map((key) => ({
    label: CONTEXT_TARGETS[key].label,
    sub: CONTEXT_SUBS[key],
    value: key,
  })),
};
