import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetRateLimits } from '@/lib/server/rateLimit';

// Integration coverage for POST /api/portal/redeem's rate-limit contract —
// the underlying checkRateLimit() utility already has thorough unit tests
// (lib/server/__tests__/rateLimit.test.ts); what's untested is the route's
// actual use of it: only a wrong/unknown code should consume budget, a
// correct redemption never should (a busy café must never get throttled),
// and hitting the limit has to return 429 with a clear message.
//
// Same small, purpose-built fake Supabase client as
// app/admin/__tests__/approveApplication.test.ts, reused here rather than a
// new abstraction.

interface Row {
  id: string;
  [key: string]: unknown;
}

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: null }> {
  private filters: Array<(row: Row) => boolean> = [];
  private op: 'select' | 'update' = 'select';
  private payload?: Record<string, unknown>;

  constructor(
    private store: Map<string, Row[]>,
    private tableName: string,
  ) {}

  select() {
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

  private table(): Row[] {
    return this.store.get(this.tableName) ?? [];
  }

  private matched(): Row[] {
    return this.table().filter((r) => this.filters.every((f) => f(r)));
  }

  private execute(): { data: unknown; error: null } {
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

  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const store = new Map<string, Row[]>();

vi.mock('@/lib/portalSession', () => ({
  hasPortalSession: vi.fn(async () => true),
}));

vi.mock('@/lib/server/featureFlags', () => ({
  isFeatureEnabled: vi.fn(async () => true),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => new FakeQueryBuilder(store, table),
  }),
}));

const { POST } = await import('../route');

function redeemRequest(cafeId: string, code: string) {
  return new Request('https://example.com/api/portal/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cafeId, code }),
  });
}

const CAFE_ID = 'cafe-1';

describe('POST /api/portal/redeem', () => {
  beforeEach(() => {
    __resetRateLimits();
    store.set('rewards', [
      { id: 'reward-active', code: 'GOOD1', status: 'active', pending_cafe_id: CAFE_ID, user_id: 'user-1', expires_at: new Date(Date.now() + 60_000).toISOString(), redeemed_at: null },
      { id: 'reward-used', code: 'USED1', status: 'redeemed', pending_cafe_id: CAFE_ID, user_id: 'user-2', expires_at: new Date(Date.now() + 60_000).toISOString(), redeemed_at: new Date().toISOString() },
    ]);
  });

  it('redeems a correct, active code', async () => {
    const res = await POST(redeemRequest(CAFE_ID, 'GOOD1'));
    expect(res.status).toBe(200);
    const reward = (store.get('rewards') ?? []).find((r) => r.id === 'reward-active');
    expect(reward?.status).toBe('redeemed');
  });

  it('rejects a code that does not exist for this café', async () => {
    const res = await POST(redeemRequest(CAFE_ID, 'ZZZZZ'));
    expect(res.status).toBe(404);
  });

  it('rejects an already-redeemed code with 409, not a rate-limited failure', async () => {
    const res = await POST(redeemRequest(CAFE_ID, 'USED1'));
    expect(res.status).toBe(409);
  });

  it('an unknown code repeated past the limit trips the rate limit (429)', async () => {
    // MAX_FAILED_REDEMPTIONS is 20 in the route — exhaust it with wrong guesses.
    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      lastStatus = (await POST(redeemRequest(CAFE_ID, 'WRONG'))).status;
    }
    expect(lastStatus).toBe(429);
  });

  it('an already-redeemed code repeated many times never trips the rate limit — only unknown codes count', async () => {
    for (let i = 0; i < 25; i++) {
      const res = await POST(redeemRequest(CAFE_ID, 'USED1'));
      expect(res.status).toBe(409); // never 429
    }
  });

  it('a busy café redeeming many correct codes in a row is never throttled', async () => {
    store.set(
      'rewards',
      Array.from({ length: 25 }, (_, i) => ({
        id: `reward-${i}`,
        code: `CODE${i}`,
        status: 'active',
        pending_cafe_id: CAFE_ID,
        user_id: `user-${i}`,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        redeemed_at: null,
      })),
    );
    for (let i = 0; i < 25; i++) {
      const res = await POST(redeemRequest(CAFE_ID, `CODE${i}`));
      expect(res.status).toBe(200);
    }
  });

  it('a different café gets its own rate-limit budget — one café cannot exhaust another\'s', async () => {
    for (let i = 0; i < 21; i++) {
      await POST(redeemRequest(CAFE_ID, 'WRONG'));
    }
    const res = await POST(redeemRequest('cafe-2', 'WRONG'));
    expect(res.status).toBe(404); // not 429 — cafe-2's budget is untouched
  });
});
