// Hero teaser: Q1–Q4 from the full 9-question quiz (Appendix A) — drink
// category, the adaptive drink_profile question, room energy, and how long
// a visit lasts — plus one question the real 9-question spec doesn't have
// at all: what the visitor is actually there to do (see CONTEXT_QUESTION in
// full-quiz.ts). Was Q1–Q3 (drink + energy only); a 4th real dimension
// (pace) was added on request to score one more axis for real instead of
// leaving it at the neutral default — see ANSWERED_DIMS in
// components/HomeContent.tsx, which has to grow in lockstep with this or
// calculateMatch() silently ignores whatever this adds. The remaining 5
// taste-dim questions and the account to save them in belong to the real
// product, not this preview; the context question belongs here
// specifically, because contextFit() already existed in the matching
// engine with nothing to feed it until now.
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

export const HERO_QUIZ: QuizQuestion[] = [...FULL_QUIZ.slice(0, 4), CONTEXT_QUESTION];
