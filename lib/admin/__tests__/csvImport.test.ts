import { describe, expect, it } from 'vitest';
import { validateCsvRows } from '../csvImport';

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

  describe('address', () => {
    it('omits address from the payload when blank, without an error', () => {
      const [result] = validateCsvRows([baseRow()], new Set());
      expect(result.errors).toEqual([]);
      expect(result.payload).not.toHaveProperty('address');
    });

    it('passes a provided address through untouched — geocoding happens later, in importCafesCsv', () => {
      const [result] = validateCsvRows([baseRow({ address: '1613 9 St SW, Calgary, AB' })], new Set());
      expect(result.errors).toEqual([]);
      expect(result.payload).toMatchObject({ address: '1613 9 St SW, Calgary, AB' });
    });
  });
});
