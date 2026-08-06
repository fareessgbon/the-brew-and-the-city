// Hero teaser: Q1–Q3 from the full 9-question quiz (Appendix A) — drink
// category, the adaptive drink_profile question, and room energy. This is
// the whole quiz this build shows; the remaining 6 questions and the
// account to save them in belong to the real product, not this preview.
import { FULL_QUIZ, type QuizQuestion } from './full-quiz';

export type { QuizQuestion, TasteQuizOption, CategoryQuizOption, TasteQuizQuestion, CategoryQuizQuestion } from './full-quiz';
export { tasteOptionsFor } from './full-quiz';

export const HERO_QUIZ: QuizQuestion[] = FULL_QUIZ.slice(0, 3);
