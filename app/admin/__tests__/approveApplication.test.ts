import { beforeEach, describe, expect, it, vi } from 'vitest';

// End-to-end coverage of the actual approveApplication action (not just the
// pure planApplicationApproval logic already covered in
// lib/admin/__tests__/partnerOnboarding.test.ts) — the literal flow from the
// Phase 2 spec: application submitted -> admin approves -> café created ->
// portal credentials available -> café linked back to the application.
//
// A small in-memory fake stands in for the Supabase client rather than a
// generic PostgREST mock — it supports exactly the query shapes
// approveApplication actually issues (select/insert/update, eq/like,
// maybeSingle/single, or awaiting the builder directly), which is enough to
// exercise the real code path faithfully without hitting a real database.

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

  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  like(col: string, pattern: string) {
    const re = new RegExp(`^${pattern.replace(/%/g, '.*')}$`);
    this.filters.push((r) => re.test(String(r[col])));
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
      const row = { id: `generated-${this.table().length + 1}`, ...this.payload } as Row;
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

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => new FakeQueryBuilder(store, table),
  }),
}));

const { approveApplication } = await import('../actions');

function seedApplication(overrides: Record<string, unknown> = {}): Row {
  const application: Row = {
    id: 'app-1',
    status: 'pending',
    cafe_name: 'Sunset Coffee',
    email: 'owner@sunsetcoffee.example',
    neighbourhood: 'Mission',
    instagram: '@sunsetcoffee',
    cafe_id: null,
    ...overrides,
  };
  store.set('partner_applications', [application]);
  return application;
}

describe('approveApplication (end to end)', () => {
  beforeEach(() => {
    store.clear();
    store.set('cafes', []);
    store.set('audit_log', []);
  });

  it('application submitted -> admin approves -> café created -> portal credentials available -> café appears correctly', async () => {
    seedApplication();

    await approveApplication('app-1');

    const cafes = store.get('cafes') ?? [];
    expect(cafes).toHaveLength(1);
    const cafe = cafes[0];

    // Café created, pre-filled from the application.
    expect(cafe.name).toBe('Sunset Coffee');
    expect(cafe.slug).toBe('sunset-coffee');
    expect(cafe.neighbourhood).toBe('Mission');
    expect(cafe.contact_email).toBe('owner@sunsetcoffee.example');
    expect(cafe.instagram_handle).toBe('@sunsetcoffee');

    // Never auto-promoted to a premium tier.
    expect(cafe.partner_status).toBe('listed');

    // Onboarding tracked, not yet completed (no portal login has happened).
    expect(cafe.onboarding_status).toBe('pending_portal_setup');

    // Portal credentials generated and available on the café record.
    expect(typeof cafe.portal_pin).toBe('string');
    expect(cafe.portal_pin).toHaveLength(6);

    // Application <-> café relationship recorded, history preserved (the
    // application row still exists with its original submitted data).
    const applications = store.get('partner_applications') ?? [];
    expect(applications).toHaveLength(1);
    expect(applications[0].status).toBe('approved');
    expect(applications[0].cafe_id).toBe(cafe.id);
    expect(applications[0].cafe_name).toBe('Sunset Coffee'); // original submission untouched

    // Audit logged: both the application approval and the café creation —
    // and the credential itself never appears in the log.
    const auditRows = store.get('audit_log') ?? [];
    expect(auditRows.map((r) => r.action)).toEqual(['application.approve', 'cafe.create']);
    const cafeCreateEntry = auditRows.find((r) => r.action === 'cafe.create');
    expect(JSON.stringify(cafeCreateEntry)).not.toContain(cafe.portal_pin);
  });

  it('a second approval of an already-approved application does not create a duplicate café', async () => {
    seedApplication();
    await approveApplication('app-1');
    expect(store.get('cafes')).toHaveLength(1);

    // Simulate the double-click / concurrent second request.
    await approveApplication('app-1');

    expect(store.get('cafes')).toHaveLength(1);
    // Only the first approval's audit trail exists — the skip path doesn't log again.
    expect((store.get('audit_log') ?? []).length).toBe(2);
  });

  it('two concurrent approvals of the same pending application never create two cafés', async () => {
    seedApplication();

    // Simulates a double-click / two overlapping requests: both read the
    // application while it's still 'pending' before either has written
    // anything back. Only one may ever create a café.
    await Promise.all([approveApplication('app-1'), approveApplication('app-1')]);

    const cafes = store.get('cafes') ?? [];
    expect(cafes).toHaveLength(1);

    const applications = store.get('partner_applications') ?? [];
    expect(applications).toHaveLength(1);
    expect(applications[0].status).toBe('approved');
    expect(applications[0].cafe_id).toBe(cafes[0].id);
  });

  it('a second café applying under the same name gets a collision-safe slug, not a duplicate/failed insert', async () => {
    seedApplication({ id: 'app-1', cafe_name: 'Sunset Coffee' });
    await approveApplication('app-1');

    seedApplication({ id: 'app-2', cafe_name: 'Sunset Coffee', email: 'other-owner@example.com' });
    // partner_applications now holds both app-1 (approved) and app-2 (pending) —
    // re-seed appends rather than replaces since seedApplication overwrites the
    // whole table, so seed both explicitly for this case.
    store.set('partner_applications', [
      { id: 'app-1', status: 'approved', cafe_name: 'Sunset Coffee', email: 'owner@sunsetcoffee.example', neighbourhood: 'Mission', instagram: '@sunsetcoffee', cafe_id: (store.get('cafes') ?? [])[0]?.id ?? null },
      { id: 'app-2', status: 'pending', cafe_name: 'Sunset Coffee', email: 'other-owner@example.com', neighbourhood: 'Beltline', instagram: null },
    ]);

    await approveApplication('app-2');

    const cafes = store.get('cafes') ?? [];
    expect(cafes).toHaveLength(2);
    expect(cafes.map((c) => c.slug).sort()).toEqual(['sunset-coffee', 'sunset-coffee-2']);
  });
});
