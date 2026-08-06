export {
  DIMS,
  WEIGHTS,
  LABELS,
  CONTEXTS,
  CONTEXT_TARGETS,
  CONTEXT_WEIGHTS,
  PROXIMITY_PLATEAU_KM,
  PROXIMITY_TAU_SUMMER_KM,
  PROXIMITY_WINTER_MULTIPLIER,
  WINTER_MONTHS,
  SCORE_MIN,
  SCORE_MAX,
  SCORE_WEIGHTS,
  PRIMARY_DRINK_CATEGORIES,
  PRIMARY_DRINK_CATEGORY_LABELS,
  type Dim,
  type ContextKey,
  type PrimaryDrinkCategory,
} from './constants';

export {
  NEUTRAL_VECTOR,
  clampDim,
  blendVectors,
  isValidVector,
  withDefaults,
  type TasteVector,
} from './vectors';

export { tasteFit } from './taste-fit';
export { contextFit } from './context-fit';
export { proximityFit, seasonDistanceMultiplier } from './proximity-fit';
export { tasteReason, contextReason, proximityReason } from './explain';
export {
  calculateMatch,
  isWithinRadius,
  filterWithinRadius,
  type CalculateMatchInput,
  type MatchResult,
} from './score';
