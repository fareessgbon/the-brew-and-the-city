// Hero teaser: nine playful questions, written to feel like a chat about
// your café habits rather than a survey. Every taste question maps onto one
// of the same real taste dimensions the full quiz (full-quiz.ts, Appendix A)
// scores — drink, adventure, aesthetic, energy, pace, food, price — with the
// same delta ranges, so the matching engine treats the answers identically.
// Plus the drink category and the "what's the plan" context question that
// feeds contextFit(). Only the wording here is new; the spec'd quiz in
// FULL_QUIZ keeps its own copy for the real product.
//
// ANSWERED_DIMS in components/HomeContent.tsx has to list exactly the taste
// dims asked here, or calculateMatch() silently ignores the extras. The
// question count is also written out in HomeContent's copy ("Nine…").
import { CONTEXT_QUESTION, FULL_QUIZ, type QuizQuestion } from './full-quiz';

export type {
  QuizQuestion,
  TasteQuizOption,
  CategoryQuizOption,
  TasteQuizQuestion,
  CategoryQuizQuestion,
  ContextQuizOption,
  ContextQuizQuestion,
} from './full-quiz';
export { tasteOptionsFor } from './full-quiz';

const [CATEGORY_Q, DRINK_Q] = FULL_QUIZ;

export const HERO_QUIZ: QuizQuestion[] = [
  // 1 — drink category
  { ...CATEGORY_Q, question: 'First things first: what’s in your cup?' } as QuizQuestion,
  // 2 — sweetness / how you take it (wording adapts to the answer above)
  { ...DRINK_Q, question: 'And how do you take it?' } as QuizQuestion,
  // 3 — adventure: fun drinks vs classic
  {
    kind: 'taste',
    dim: 'adventure',
    question: 'Fun drinks, or the classics?',
    options: [
      { label: 'The classics, done right', sub: 'don’t mess with perfection', delta: -35 },
      { label: 'Mostly classics', sub: 'with the odd treat', delta: -10 },
      { label: 'I’ll try the special if it sounds fun', delta: 15 },
      { label: 'Lavender-honey-oat-cloud? Obviously.', sub: 'bring on the weird menu', delta: 38 },
    ],
  },
  // 4 — aesthetic
  {
    kind: 'taste',
    dim: 'aesthetic',
    question: 'Which café would you actually post?',
    options: [
      { label: 'Clean and industrial', sub: 'concrete, steel, one very good plant', delta: -35 },
      { label: 'Calm and minimal', sub: 'light wood, soft, Japandi', delta: -12 },
      { label: 'Cosy and green', sub: 'plants, warm light, mismatched chairs', delta: 18 },
      { label: 'Gloriously maximal', sub: 'records, art, happy clutter', delta: 38 },
    ],
  },
  // 5 — energy
  {
    kind: 'taste',
    dim: 'energy',
    question: 'What’s the soundtrack in your perfect café?',
    options: [
      { label: 'Library silence', sub: 'headphones on, world off', delta: -35 },
      { label: 'Soft lo-fi', sub: 'a quiet hum of chatter', delta: -12 },
      { label: 'A buzzy room', sub: 'good playlist, good energy', delta: 15 },
      { label: 'Loud and lively', sub: 'music up, people everywhere', delta: 38 },
    ],
  },
  // 6 — pace
  {
    kind: 'taste',
    dim: 'pace',
    question: 'How long are you settling in for?',
    options: [
      { label: 'Grab it and go', sub: 'under ten minutes', delta: -38 },
      { label: 'A quick half hour', delta: -12 },
      { label: 'An hour or two', sub: 'laptop, book, or good company', delta: 18 },
      { label: 'Till they stack the chairs', delta: 40 },
    ],
  },
  // 7 — the plan (context)
  { ...CONTEXT_QUESTION, question: 'So what’s the plan?' } as QuizQuestion,
  // 8 — food
  {
    kind: 'taste',
    dim: 'food',
    question: 'Snack situation?',
    options: [
      { label: 'Just the drink, thanks', delta: -35 },
      { label: 'Maybe a pastry', delta: -8 },
      { label: 'The pastry case is half the reason I came', delta: 20 },
      { label: 'No real food, no visit', delta: 38 },
    ],
  },
  // 9 — price
  {
    kind: 'taste',
    dim: 'price',
    question: 'What’s a really good drink worth to you?',
    options: [
      { label: 'Under $6', sub: 'or I’m making it at home', delta: -38 },
      { label: '$6–7 feels about right', sub: 'a regular, no frills', delta: -10 },
      { label: '$8–10 for a fun one', sub: 'if it’s genuinely good', delta: 18 },
      { label: '$10 and up', sub: 'I never look at the price', delta: 38 },
    ],
  },
];
