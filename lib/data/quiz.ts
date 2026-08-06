// Hero teaser: Q1–Q3 from the full 9-question quiz (Appendix A) — drink
// category, the adaptive drink_profile question, and room energy. The full
// quiz behind signup picks up from Q4 — see /onboarding/quiz and
// lib/quizProgress.ts for how answers here carry across that boundary.
import { FULL_QUIZ, type QuizQuestion } from './full-quiz';

export type { QuizQuestion, TasteQuizOption, CategoryQuizOption, TasteQuizQuestion, CategoryQuizQuestion } from './full-quiz';
export { tasteOptionsFor } from './full-quiz';

export const HERO_QUIZ: QuizQuestion[] = FULL_QUIZ.slice(0, 3);
