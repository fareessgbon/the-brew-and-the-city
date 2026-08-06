import { describe, expect, it } from 'vitest';
import { rewardItemFieldsFromForm } from '../rewardItems';

function baseForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const fields: Record<string, string> = {
    name: 'Iced Matcha',
    category: 'drink',
    reimbursement_dollars: '4.00',
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return form;
}

describe('rewardItemFieldsFromForm', () => {
  it('accepts a minimal valid submission', () => {
    const result = rewardItemFieldsFromForm(baseForm());
    expect('fields' in result).toBe(true);
    if ('fields' in result) {
      expect(result.fields).toMatchObject({
        name: 'Iced Matcha',
        category: 'drink',
        description: null,
        price_cents: null,
        reimbursement_cents: 400,
        monthly_cap: null,
        is_available: false,
      });
    }
  });

  it('rejects a missing name', () => {
    const result = rewardItemFieldsFromForm(baseForm({ name: '' }));
    expect(result).toEqual({ error: 'Item name is required.' });
  });

  it('rejects an invalid category', () => {
    const result = rewardItemFieldsFromForm(baseForm({ category: 'dessert' }));
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toContain('Category must be one of');
  });

  it('accepts each valid category', () => {
    for (const category of ['drink', 'pastry', 'food', 'other']) {
      const result = rewardItemFieldsFromForm(baseForm({ category }));
      expect('fields' in result).toBe(true);
    }
  });

  it('rejects a negative regular price', () => {
    const result = rewardItemFieldsFromForm(baseForm({ price_dollars: '-1' }));
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/negative/i);
  });

  it('converts a valid regular price to cents', () => {
    const result = rewardItemFieldsFromForm(baseForm({ price_dollars: '6.50' }));
    if ('fields' in result) expect(result.fields.price_cents).toBe(650);
  });

  it('leaves price_cents null when the regular price is left blank', () => {
    const result = rewardItemFieldsFromForm(baseForm({ price_dollars: '' }));
    if ('fields' in result) expect(result.fields.price_cents).toBeNull();
  });

  it('rejects a negative reimbursement', () => {
    const result = rewardItemFieldsFromForm(baseForm({ reimbursement_dollars: '-4' }));
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/negative/i);
  });

  it('rejects a missing reimbursement — unlike price, it is required', () => {
    const result = rewardItemFieldsFromForm(baseForm({ reimbursement_dollars: '' }));
    expect('error' in result).toBe(true);
  });

  it('accepts a zero reimbursement (free to the platform, still explicit)', () => {
    const result = rewardItemFieldsFromForm(baseForm({ reimbursement_dollars: '0' }));
    if ('fields' in result) expect(result.fields.reimbursement_cents).toBe(0);
  });

  it('converts reimbursement dollars to cents', () => {
    const result = rewardItemFieldsFromForm(baseForm({ reimbursement_dollars: '5.25' }));
    if ('fields' in result) expect(result.fields.reimbursement_cents).toBe(525);
  });

  it('rejects a fractional monthly cap', () => {
    const result = rewardItemFieldsFromForm(baseForm({ monthly_cap: '2.5' }));
    expect('error' in result).toBe(true);
  });

  it('rejects a zero monthly cap', () => {
    const result = rewardItemFieldsFromForm(baseForm({ monthly_cap: '0' }));
    expect('error' in result).toBe(true);
  });

  it('rejects a negative monthly cap', () => {
    const result = rewardItemFieldsFromForm(baseForm({ monthly_cap: '-3' }));
    expect('error' in result).toBe(true);
  });

  it('accepts a valid whole-number monthly cap', () => {
    const result = rewardItemFieldsFromForm(baseForm({ monthly_cap: '10' }));
    if ('fields' in result) expect(result.fields.monthly_cap).toBe(10);
  });

  it('leaves monthly_cap null when left blank (no cap)', () => {
    const result = rewardItemFieldsFromForm(baseForm());
    if ('fields' in result) expect(result.fields.monthly_cap).toBeNull();
  });

  it('reads is_available from the checkbox convention ("true" or absent)', () => {
    const off = rewardItemFieldsFromForm(baseForm());
    const on = rewardItemFieldsFromForm(baseForm({ is_available: 'true' }));
    if ('fields' in off) expect(off.fields.is_available).toBe(false);
    if ('fields' in on) expect(on.fields.is_available).toBe(true);
  });

  it('trims description and treats blank as null', () => {
    const blank = rewardItemFieldsFromForm(baseForm({ description: '   ' }));
    const withText = rewardItemFieldsFromForm(baseForm({ description: '  12oz, oat included  ' }));
    if ('fields' in blank) expect(blank.fields.description).toBeNull();
    if ('fields' in withText) expect(withText.fields.description).toBe('12oz, oat included');
  });
});
