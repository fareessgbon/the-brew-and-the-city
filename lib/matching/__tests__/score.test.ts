import { describe, expect, it } from 'vitest';
import { DIMS, SCORE_MAX, SCORE_MIN, type Dim } from '../constants';
import { calculateMatch, filterWithinRadius, isWithinRadius, type CalculateMatchInput } from '../score';
import { NEUTRAL_VECTOR, withDefaults, type TasteVector } from '../vectors';

const MID: TasteVector = { ...NEUTRAL_VECTOR };

const LOW: TasteVector = DIMS.reduce((acc, d) => {
  acc[d] = 10;
  return acc;
}, {} as TasteVector);

const HIGH: TasteVector = DIMS.reduce((acc, d) => {
  acc[d] = 90;
  return acc;
}, {} as TasteVector);

function baseInput(overrides: Partial<CalculateMatchInput> = {}): CalculateMatchInput {
  return {
    userProfile: MID,
    cafeProfile: MID,
    distanceMetres: 500,
    month: 6, // June — summer, outside the winter window
    ...overrides,
  };
}

describe('calculateMatch', () => {
  it('scores identical vectors highly', () => {
    const result = calculateMatch(baseInput({ userProfile: HIGH, cafeProfile: HIGH }));
    expect(result.tasteScore).toBeGreaterThanOrEqual(95);
    expect(result.totalScore).toBeGreaterThanOrEqual(85);
  });

  it('scores opposite vectors lower than identical ones', () => {
    const identical = calculateMatch(baseInput({ userProfile: HIGH, cafeProfile: HIGH }));
    const opposite = calculateMatch(baseInput({ userProfile: LOW, cafeProfile: HIGH }));
    expect(opposite.tasteScore).toBeLessThan(identical.tasteScore);
    expect(opposite.totalScore).toBeLessThan(identical.totalScore);
  });

  it('reduces the proximity (and total) score for a distant café in winter vs. summer', () => {
    const distantInput = baseInput({ distanceMetres: 8000 });
    const summer = calculateMatch({ ...distantInput, month: 7 }); // July
    const winter = calculateMatch({ ...distantInput, month: 1 }); // January
    expect(summer.proximityScore).not.toBeNull();
    expect(winter.proximityScore).not.toBeNull();
    expect(winter.proximityScore!).toBeLessThan(summer.proximityScore!);
    expect(winter.totalScore).toBeLessThanOrEqual(summer.totalScore);
  });

  it('does not reduce proximity for a nearby café in winter — the plateau still applies', () => {
    const nearInput = baseInput({ distanceMetres: 800 }); // under the 1km plateau
    const summer = calculateMatch({ ...nearInput, month: 7 });
    const winter = calculateMatch({ ...nearInput, month: 1 });
    expect(winter.proximityScore).toBe(summer.proximityScore);
    expect(winter.proximityScore).toBe(100);
  });

  it('filters cafés outside the stated radius', () => {
    const cafes = [
      { id: 'a', distanceMetres: 500 },
      { id: 'b', distanceMetres: 4000 },
      { id: 'c', distanceMetres: 15000 },
    ];
    const within10km = filterWithinRadius(cafes, 10);
    expect(within10km.map((c) => c.id)).toEqual(['a', 'b']);
    expect(isWithinRadius(15000, 10)).toBe(false);
    expect(isWithinRadius(4000, 10)).toBe(true);
  });

  it('does not crash on missing/partial vector values — withDefaults fills them neutrally', () => {
    const partial = { drink: 80, energy: 20 } as Partial<Record<Dim, unknown>>;
    const filled = withDefaults(partial);
    expect(() => calculateMatch(baseInput({ cafeProfile: filled }))).not.toThrow();
    expect(filled.aesthetic).toBe(50);
    expect(filled.food).toBe(50);
  });

  it('does not crash on an empty answeredDims list', () => {
    expect(() =>
      calculateMatch(baseInput({ answeredDims: [] })),
    ).not.toThrow();
  });

  it(
    'CANNOT let partner status change Match % — a listed and a partner café ' +
      'with identical profiles score identically. calculateMatch has no ' +
      'parameter for partner/paid status at all, so this isn’t just an ' +
      'empirical equality, it’s structurally impossible to break.',
    () => {
      const cafeProfile: TasteVector = { ...HIGH };
      const shared = { userProfile: MID, cafeProfile, distanceMetres: 2400, month: 3 };

      // Two "cafés" with identical taste profiles, one hypothetically listed
      // (unpaid) and one hypothetically a paying partner — represented here
      // by the fact that nothing about payment status is or could be passed in.
      const listedCafeResult = calculateMatch({ ...shared });
      const partnerCafeResult = calculateMatch({ ...shared });

      expect(listedCafeResult).toEqual(partnerCafeResult);
    },
  );

  it('keeps totalScore within [SCORE_MIN, SCORE_MAX] across a wide input sweep', () => {
    const distances = [0, 100, 500, 1000, 2400, 5000, 12000, 25000];
    const months = [1, 2, 3, 4, 6, 7, 9, 11, 12];
    const vectors = [LOW, MID, HIGH];

    for (const distanceMetres of distances) {
      for (const month of months) {
        for (const userProfile of vectors) {
          for (const cafeProfile of vectors) {
            const { totalScore } = calculateMatch({ userProfile, cafeProfile, distanceMetres, month });
            expect(totalScore).toBeGreaterThanOrEqual(SCORE_MIN);
            expect(totalScore).toBeLessThanOrEqual(SCORE_MAX);
          }
        }
      }
    }
  });

  it('includes a context reason when a context is given, and omits one when it is not', () => {
    const withContext = calculateMatch(baseInput({ context: 'study' }));
    const withoutContext = calculateMatch(baseInput({ context: null }));
    expect(withContext.reasons.length).toBeGreaterThan(0);
    expect(withContext.reasons[0]).toMatch(/stud/i);
    expect(withoutContext.reasons.every((r) => !/stud/i.test(r))).toBe(true);
  });

  describe('unknown distance (distanceMetres: null)', () => {
    it('returns proximityScore: null and drops the proximity reason', () => {
      const result = calculateMatch(baseInput({ distanceMetres: null }));
      expect(result.proximityScore).toBeNull();
      expect(result.reasons.some((r) => /corner|radius/i.test(r))).toBe(false);
    });

    it('does not silently score like distance=0 (right around the corner) or distance=Infinity (0 score)', () => {
      // A middling (not maxed-out) taste match, so the score isn't already
      // pinned to SCORE_MAX regardless of the proximity component.
      const partial = baseInput({ userProfile: MID, cafeProfile: HIGH });
      const unknown = calculateMatch({ ...partial, distanceMetres: null });
      const zero = calculateMatch({ ...partial, distanceMetres: 0 });
      const veryFar = calculateMatch({ ...partial, distanceMetres: 200_000 });
      // Same taste/context inputs, so an "unknown" score should sit on its
      // own — not collapse onto either extreme.
      expect(unknown.totalScore).not.toBe(zero.totalScore);
      expect(unknown.totalScore).not.toBe(veryFar.totalScore);
    });

    it('still respects taste differences with an unknown distance', () => {
      const identical = calculateMatch(baseInput({ userProfile: HIGH, cafeProfile: HIGH, distanceMetres: null }));
      const opposite = calculateMatch(baseInput({ userProfile: LOW, cafeProfile: HIGH, distanceMetres: null }));
      expect(opposite.totalScore).toBeLessThan(identical.totalScore);
    });

    it('stays within [SCORE_MIN, SCORE_MAX] with an unknown distance', () => {
      for (const userProfile of [LOW, MID, HIGH]) {
        for (const cafeProfile of [LOW, MID, HIGH]) {
          const { totalScore } = calculateMatch(baseInput({ userProfile, cafeProfile, distanceMetres: null }));
          expect(totalScore).toBeGreaterThanOrEqual(SCORE_MIN);
          expect(totalScore).toBeLessThanOrEqual(SCORE_MAX);
        }
      }
    });
  });

  describe('no context selected (context: null/undefined)', () => {
    it('returns contextScore: null rather than a free 100', () => {
      const result = calculateMatch(baseInput({ context: null }));
      expect(result.contextScore).toBeNull();
    });

    it('does not inflate every match to a perfect context score', () => {
      // Before this was fixed, a missing context silently contributed 100 to
      // the blend for every café — this pins down that a middling taste
      // match with no context selected is not artificially propped up.
      const partial = calculateMatch(baseInput({ userProfile: MID, cafeProfile: HIGH, context: null }));
      const withContext = calculateMatch(baseInput({ userProfile: MID, cafeProfile: HIGH, context: 'study' }));
      expect(partial.contextScore).toBeNull();
      expect(withContext.contextScore).not.toBeNull();
      // Both real components (taste, and taste+context respectively) should
      // still drive a real, non-identical score — not both defaulting to the
      // same "everything gets 100 for the missing part" number.
      expect(partial.totalScore).not.toBe(withContext.totalScore);
    });

    it('still respects taste differences with no context selected', () => {
      const identical = calculateMatch(baseInput({ userProfile: HIGH, cafeProfile: HIGH, context: null }));
      const opposite = calculateMatch(baseInput({ userProfile: LOW, cafeProfile: HIGH, context: null }));
      expect(opposite.totalScore).toBeLessThan(identical.totalScore);
    });

    it('stays within [SCORE_MIN, SCORE_MAX] with no context and no distance', () => {
      for (const userProfile of [LOW, MID, HIGH]) {
        for (const cafeProfile of [LOW, MID, HIGH]) {
          const { totalScore } = calculateMatch(baseInput({ userProfile, cafeProfile, context: null, distanceMetres: null }));
          expect(totalScore).toBeGreaterThanOrEqual(SCORE_MIN);
          expect(totalScore).toBeLessThanOrEqual(SCORE_MAX);
        }
      }
    });
  });
});
