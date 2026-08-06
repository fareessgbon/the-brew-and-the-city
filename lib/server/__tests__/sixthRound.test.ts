import { beforeEach, describe, expect, it, vi } from 'vitest';

// Exercises the real activateReward() against a small in-memory fake of the
// Supabase client — same approach as app/admin/__tests__/approveApplication.test.ts.
// Supports exactly the query shapes activateReward actually issues: select
// (with a `{ count: 'exact', head: true }` variant for the cap checks),
// update, eq/gte, maybeSingle/single, or awaiting the builder directly.

interface Row {
  id: string;
  [key: string]: unknown;
}

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: null; count?: number }> {
  private filters: Array<(row: Row) => boolean> = [];
  private op: 'select' | 'update' = 'select';
  private payload?: Record<string, unknown>;
  private countMode = false;

  constructor(
    private store: Map<string, Row[]>,
    private tableName: string,
  ) {}

  select(_col?: string, opts?: { count?: 'exact'; head?: boolean }) {
    if (opts?.count) this.countMode = true;
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

  gte(col: string, val: string) {
    this.filters.push((r) => typeof r[col] === 'string' && (r[col] as string) >= val);
    return this;
  }

  private table(): Row[] {
    return this.store.get(this.tableName) ?? [];
  }

  private matched(): Row[] {
    return this.table().filter((r) => this.filters.every((f) => f(r)));
  }

  private execute(): { data: unknown; error: null; count?: number } {
    if (this.op === 'update') {
      const matches = this.matched();
      matches.forEach((r) => Object.assign(r, this.payload));
      return { data: matches, error: null };
    }
    const matches = this.matched();
    if (this.countMode) return { data: null, error: null, count: matches.length };
    return { data: matches, error: null };
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
    onfulfilled?: ((value: { data: unknown; error: null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const store = new Map<string, Row[]>();

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => new FakeQueryBuilder(store, table),
  }),
}));

const { activateReward, ActivationError } = await import('../sixthRound');

const NOW_ISO = new Date().toISOString();

function seedCafe(overrides: Record<string, unknown> = {}) {
  store.set('cafes', [{ id: 'cafe-1', name: 'Sunset Coffee', partner_status: 'partner', monthly_redemption_cap: 5, ...overrides }]);
}

function seedItem(overrides: Record<string, unknown> = {}) {
  store.set('reward_items', [{ id: 'item-1', cafe_id: 'cafe-1', is_available: true, monthly_cap: null, ...overrides }]);
}

function seedReward(id: string, userId: string, overrides: Record<string, unknown> = {}) {
  const reward: Row = { id, user_id: userId, status: 'active', code: null, pending_cafe_id: null, reward_item_id: null, activated_at: null, expires_at: null, ...overrides };
  store.set('rewards', [...(store.get('rewards') ?? []), reward]);
  return reward;
}

describe('activateReward', () => {
  beforeEach(() => {
    store.clear();
    seedCafe();
    seedItem();
    store.set('rewards', []);
  });

  it('activates successfully when under the cap', async () => {
    seedReward('reward-1', 'user-1');

    const { reward, cafeName } = await activateReward('user-1', 'cafe-1', 'item-1');

    expect(reward.code).toEqual(expect.any(String));
    expect(reward.pending_cafe_id).toBe('cafe-1');
    expect(cafeName).toBe('Sunset Coffee');
  });

  it('rejects activation once the café cap is already used up — even with no redemptions yet', async () => {
    seedCafe({ monthly_redemption_cap: 1 });
    // One prior activation this month, never redeemed — still counts (see
    // sixthRound.ts's countCafeSlotsUsed comment on the trade-off).
    seedReward('reward-used', 'user-0', { pending_cafe_id: 'cafe-1', reward_item_id: 'item-1', activated_at: NOW_ISO, code: 'AAAA', expires_at: NOW_ISO });
    seedReward('reward-2', 'user-2');

    await expect(activateReward('user-2', 'cafe-1', 'item-1')).rejects.toThrow(ActivationError);

    const reward2 = (store.get('rewards') ?? []).find((r) => r.id === 'reward-2');
    expect(reward2?.code).toBeNull(); // never touched — rejected before the update
  });

  it('rejects activation once the item cap is used up, independently of the café cap', async () => {
    seedItem({ monthly_cap: 1 });
    seedReward('reward-used', 'user-0', { pending_cafe_id: 'cafe-1', reward_item_id: 'item-1', activated_at: NOW_ISO, code: 'AAAA', expires_at: NOW_ISO });
    seedReward('reward-2', 'user-2');

    await expect(activateReward('user-2', 'cafe-1', 'item-1')).rejects.toThrow(ActivationError);
  });

  it('two concurrent activations against a cap of 1 never both succeed — exactly one wins, the other rolls back', async () => {
    seedCafe({ monthly_redemption_cap: 1 });
    seedReward('reward-a', 'user-a');
    seedReward('reward-b', 'user-b');

    const results = await Promise.allSettled([activateReward('user-a', 'cafe-1', 'item-1'), activateReward('user-b', 'cafe-1', 'item-1')]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // The loser was rolled back to a clean, re-activatable state, not left
    // half-activated.
    const rewards = store.get('rewards') ?? [];
    const activated = rewards.filter((r) => r.code !== null);
    expect(activated).toHaveLength(1);
    const rolledBack = rewards.find((r) => r.code === null);
    expect(rolledBack?.pending_cafe_id).toBeNull();
    expect(rolledBack?.activated_at).toBeNull();
  });

  it('rejects when there is no active reward to activate', async () => {
    await expect(activateReward('nobody', 'cafe-1', 'item-1')).rejects.toThrow(ActivationError);
  });
});
