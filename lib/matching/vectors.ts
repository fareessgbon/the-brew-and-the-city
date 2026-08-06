import { DIMS, type Dim } from './constants';

export type TasteVector = Record<Dim, number>;

export const NEUTRAL_VECTOR: TasteVector = DIMS.reduce((acc, d) => {
  acc[d] = 50;
  return acc;
}, {} as TasteVector);

export function clampDim(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// Blends a stronger signal (e.g. a named go-to café) into an existing
// vector. otherWeight is how much the new signal should count, 0–1.
export function blendVectors(base: TasteVector, other: TasteVector, otherWeight: number): TasteVector {
  const w = Math.max(0, Math.min(1, otherWeight));
  const result = {} as TasteVector;
  for (const d of DIMS) {
    result[d] = Math.round(clampDim((1 - w) * base[d] + w * other[d]));
  }
  return result;
}

// Guards against malformed data (a partial row from a CSV import, a null
// from a join that didn't match) before it ever reaches the matching math —
// matching functions assume every dim is present and finite.
export function isValidVector(v: unknown): v is TasteVector {
  if (typeof v !== 'object' || v === null) return false;
  const record = v as Record<string, unknown>;
  return DIMS.every((d) => typeof record[d] === 'number' && Number.isFinite(record[d] as number));
}

// Fills any missing/invalid dims with neutral (50) rather than throwing —
// matching should degrade gracefully, not crash a page over one bad field.
export function withDefaults(partial: Partial<Record<Dim, unknown>> | null | undefined): TasteVector {
  const result = {} as TasteVector;
  for (const d of DIMS) {
    const value = partial?.[d];
    result[d] = typeof value === 'number' && Number.isFinite(value) ? clampDim(value) : 50;
  }
  return result;
}
