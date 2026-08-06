import { describe, expect, it } from 'vitest';
import { parseCsvCoordinates, validateCsvRows } from '../csvImport';

function baseRow(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  return {
    name: 'Monogram',
    slug: 'monogram',
    neighbourhood: 'Mission',
    drink: '70',
    energy: '40',
    aesthetic: '50',
    pace: '60',
    adventure: '30',
    price: '55',
    food: '20',
    ...overrides,
  };
}

describe('validateCsvRows', () => {
  it('accepts a fully valid row and marks it "create" when the slug is new', () => {
    const [result] = validateCsvRows([baseRow()], new Set());
    expect(result.errors).toEqual([]);
    expect(result.action).toBe('create');
    expect(result.payload).toMatchObject({ name: 'Monogram', slug: 'monogram', drink_score: 70, food_score: 20 });
  });

  it('marks an existing slug as "update" instead of "create"', () => {
    const [result] = validateCsvRows([baseRow()], new Set(['monogram']));
    expect(result.action).toBe('update');
  });

  it('rejects a row missing a name', () => {
    const [result] = validateCsvRows([baseRow({ name: '' })], new Set());
    expect(result.action).toBe('reject');
    expect(result.errors).toContain('Missing name.');
  });

  it('rejects a row missing a slug', () => {
    const [result] = validateCsvRows([baseRow({ slug: '' })], new Set());
    expect(result.errors).toContain('Missing slug.');
  });

  it('flags a slug duplicated earlier in the same file, but not the first occurrence', () => {
    const [first, second] = validateCsvRows([baseRow({ slug: 'dup' }), baseRow({ name: 'Other Café', slug: 'dup' })], new Set());
    expect(first.errors).toEqual([]);
    expect(second.errors.some((e) => e.includes('Duplicate slug'))).toBe(true);
    expect(second.errors[0]).toContain('row 2');
  });

  describe('vector scores', () => {
    it('rejects a score above 100', () => {
      const [result] = validateCsvRows([baseRow({ drink: '150' })], new Set());
      expect(result.errors.some((e) => e.includes('Drink score must be a number from 0-100'))).toBe(true);
    });

    it('rejects a negative score', () => {
      const [result] = validateCsvRows([baseRow({ energy: '-5' })], new Set());
      expect(result.errors.some((e) => e.includes('Energy score must be a number from 0-100'))).toBe(true);
    });

    it('rejects a non-numeric score', () => {
      const [result] = validateCsvRows([baseRow({ aesthetic: 'high' })], new Set());
      expect(result.errors.some((e) => e.includes('Aesthetic score must be a number from 0-100'))).toBe(true);
    });

    it('rejects a missing score', () => {
      const [result] = validateCsvRows([baseRow({ food: '' })], new Set());
      expect(result.errors).toContain('Missing Food score.');
    });

    it('rounds a fractional score', () => {
      const [result] = validateCsvRows([baseRow({ pace: '60.6' })], new Set());
      expect(result.payload?.pace_score).toBe(61);
    });
  });

  describe('partner_status', () => {
    it('defaults to "listed" when omitted', () => {
      const [result] = validateCsvRows([baseRow()], new Set());
      expect(result.payload?.partner_status).toBe('listed');
    });

    it('accepts a valid status', () => {
      const [result] = validateCsvRows([baseRow({ partner_status: 'featured' })], new Set());
      expect(result.payload?.partner_status).toBe('featured');
    });

    it('rejects an unrecognized status', () => {
      const [result] = validateCsvRows([baseRow({ partner_status: 'gold_tier' })], new Set());
      expect(result.errors.some((e) => e.includes('Unknown partner_status'))).toBe(true);
      expect(result.action).toBe('reject');
    });
  });

  describe('drink_categories', () => {
    it('defaults to all four categories when omitted', () => {
      const [result] = validateCsvRows([baseRow()], new Set());
      expect(result.payload?.drink_categories).toEqual(['coffee', 'matcha', 'tea_chai', 'refreshers_other']);
    });

    it('accepts a semicolon-separated subset', () => {
      const [result] = validateCsvRows([baseRow({ drink_categories: 'coffee;matcha' })], new Set());
      expect(result.payload?.drink_categories).toEqual(['coffee', 'matcha']);
    });

    it('rejects an unrecognized category', () => {
      const [result] = validateCsvRows([baseRow({ drink_categories: 'espresso' })], new Set());
      expect(result.errors.some((e) => e.includes('Unknown drink category'))).toBe(true);
    });
  });

  describe('coordinates', () => {
    it('omits latitude/longitude from the payload when both are blank, without an error', () => {
      const [result] = validateCsvRows([baseRow()], new Set());
      expect(result.errors).toEqual([]);
      expect(result.payload).not.toHaveProperty('latitude');
      expect(result.payload).not.toHaveProperty('longitude');
    });

    it('rejects a lone latitude with no longitude', () => {
      const [result] = validateCsvRows([baseRow({ latitude: '51.0447' })], new Set());
      expect(result.errors.some((e) => e.includes('must both be provided together'))).toBe(true);
    });

    it('rejects a lone longitude with no latitude', () => {
      const [result] = validateCsvRows([baseRow({ longitude: '-114.0719' })], new Set());
      expect(result.errors.some((e) => e.includes('must both be provided together'))).toBe(true);
    });

    it('accepts a valid coordinate pair', () => {
      const [result] = validateCsvRows([baseRow({ latitude: '51.0447', longitude: '-114.0719' })], new Set());
      expect(result.errors).toEqual([]);
      expect(result.payload).toMatchObject({ latitude: 51.0447, longitude: -114.0719 });
    });

    it('rejects an out-of-range latitude', () => {
      const [result] = validateCsvRows([baseRow({ latitude: '200', longitude: '-114.0719' })], new Set());
      expect(result.errors.some((e) => e.includes('Latitude must be a number from -90 to 90'))).toBe(true);
    });

    it('rejects an out-of-range longitude', () => {
      const [result] = validateCsvRows([baseRow({ latitude: '51.0447', longitude: '-200' })], new Set());
      expect(result.errors.some((e) => e.includes('Longitude must be a number from -180 to 180'))).toBe(true);
    });

    it('rejects a non-numeric coordinate', () => {
      const [result] = validateCsvRows([baseRow({ latitude: 'north', longitude: '-114.0719' })], new Set());
      expect(result.errors.some((e) => e.includes('Latitude must be a number'))).toBe(true);
    });
  });
});

describe('parseCsvCoordinates', () => {
  it('returns nulls with no error when both fields are absent', () => {
    const errors: string[] = [];
    expect(parseCsvCoordinates({}, errors)).toEqual({ latitude: null, longitude: null });
    expect(errors).toEqual([]);
  });

  it('returns nulls and an error when only one field is present', () => {
    const errors: string[] = [];
    expect(parseCsvCoordinates({ latitude: '51' }, errors)).toEqual({ latitude: null, longitude: null });
    expect(errors.length).toBe(1);
  });

  it('returns the parsed pair when both are valid', () => {
    const errors: string[] = [];
    expect(parseCsvCoordinates({ latitude: '51.0447', longitude: '-114.0719' }, errors)).toEqual({ latitude: 51.0447, longitude: -114.0719 });
    expect(errors).toEqual([]);
  });
});
