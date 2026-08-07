import { beforeEach, describe, expect, it, vi } from 'vitest';

// createCafe/updateCafe predate the partner-onboarding pipeline's audit
// redaction (app/admin/__tests__/approveApplication.test.ts already covers
// that path) — this closes the same gap for the older, everyday café-edit
// actions: portal_pin is a live credential and must never land in
// audit_log.previous_value or .new_value, on either create or update.

interface Row {
  id: string;
  [key: string]: unknown;
}

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: null }> {
  private filters: Array<(row: Row) => boolean> = [];
  private op: 'select' | 'insert' | 'update' = 'select';
  private payload?: Record<string, unknown>;

  constructor(
    private store: Map<string, Row[]>,
    private tableName: string,
  ) {}

  select() {
    return this;
  }

  insert(payload: Record<string, unknown>) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.op = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload: Record<string, unknown>) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  in(col: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[col]));
    return this;
  }

  private table(): Row[] {
    return this.store.get(this.tableName) ?? [];
  }

  private matched(): Row[] {
    return this.table().filter((r) => this.filters.every((f) => f(r)));
  }

  private execute(): { data: unknown; error: null } {
    if (this.op === 'insert') {
      const row = { id: this.payload?.id ?? `generated-${this.table().length + 1}`, ...this.payload } as Row;
      this.store.set(this.tableName, [...this.table(), row]);
      return { data: row, error: null };
    }
    if (this.op === 'update') {
      const matches = this.matched();
      matches.forEach((r) => Object.assign(r, this.payload));
      return { data: matches, error: null };
    }
    return { data: this.matched(), error: null };
  }

  maybeSingle() {
    const { data, error } = this.execute();
    const row = Array.isArray(data) ? (data[0] ?? null) : data;
    return Promise.resolve({ data: row, error });
  }

  single() {
    const { data, error } = this.execute();
    const row = Array.isArray(data) ? data[0] : data;
    return Promise.resolve({ data: row, error });
  }

  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const store = new Map<string, Row[]>();

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn(async () => ({ email: 'admin@example.com' })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT'); // matches Next's real "interrupts execution" behavior
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => new FakeQueryBuilder(store, table),
    storage: { from: () => ({ upload: vi.fn(async () => ({ error: null })), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  }),
}));

const { createCafe, updateCafe } = await import('../actions');

function minimalCafeForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set('name', 'Sunset Coffee');
  form.set('slug', 'sunset-coffee');
  form.set('portal_pin', 'SECRET1');
  for (const [k, v] of Object.entries(overrides)) form.set(k, v);
  return form;
}

async function expectRedirect(fn: () => Promise<void>) {
  await expect(fn()).rejects.toThrow('NEXT_REDIRECT');
}

describe('createCafe / updateCafe — audit log never contains portal_pin', () => {
  beforeEach(() => {
    store.clear();
    store.set('cafes', []);
    store.set('cafe_attributes', []);
    store.set('audit_log', []);
  });

  it('createCafe logs cafe.create without portal_pin in new_value', async () => {
    await expectRedirect(() => createCafe(minimalCafeForm()));

    const entry = (store.get('audit_log') ?? []).find((e) => e.action === 'cafe.create');
    expect(entry).toBeDefined();
    expect(entry?.new_value).not.toHaveProperty('portal_pin');
    // Confirm the PIN really was saved to the café row itself — this is a
    // redaction of the audit log, not a regression in the actual feature.
    const cafe = (store.get('cafes') ?? [])[0];
    expect(cafe.portal_pin).toBe('SECRET1');
  });

  it('updateCafe logs cafe.update without portal_pin in previous_value or new_value', async () => {
    store.set('cafes', [{ id: 'cafe-1', name: 'Sunset Coffee', slug: 'sunset-coffee', portal_pin: 'OLDPIN1', partner_status: 'listed', photos: [], verified_at: null }]);

    await expectRedirect(() => updateCafe('cafe-1', minimalCafeForm({ portal_pin: 'NEWPIN1' })));

    const entry = (store.get('audit_log') ?? []).find((e) => e.action === 'cafe.update');
    expect(entry).toBeDefined();
    expect(entry?.previous_value).not.toHaveProperty('portal_pin');
    expect(entry?.new_value).not.toHaveProperty('portal_pin');
    // The actual update still happened — only the audit trail is redacted.
    const cafe = (store.get('cafes') ?? []).find((c) => c.id === 'cafe-1');
    expect(cafe?.portal_pin).toBe('NEWPIN1');
  });
});
