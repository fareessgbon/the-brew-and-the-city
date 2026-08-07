import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetRateLimits, checkRateLimit, checkRateLimitPersistent, clientIp, type RateLimitSupabase } from '../rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    __resetRateLimits();
    vi.useRealTimers();
  });

  it('allows exactly `limit` requests in a window, then blocks', () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit('k', 3, 60_000).allowed).toBe(true);
    }
    expect(checkRateLimit('k', 3, 60_000).allowed).toBe(false);
  });

  it('counts each key separately', () => {
    expect(checkRateLimit('a', 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit('a', 1, 60_000).allowed).toBe(false);
    // A different café/IP must not inherit the first one's exhausted budget —
    // this is the bug that would turn a rate limit into a global outage.
    expect(checkRateLimit('b', 1, 60_000).allowed).toBe(true);
  });

  it('reports remaining budget while allowing', () => {
    expect(checkRateLimit('r', 3, 60_000).remaining).toBe(2);
    expect(checkRateLimit('r', 3, 60_000).remaining).toBe(1);
    expect(checkRateLimit('r', 3, 60_000).remaining).toBe(0);
  });

  it('resets once the window has elapsed', () => {
    vi.useFakeTimers();
    expect(checkRateLimit('w', 1, 1_000).allowed).toBe(true);
    expect(checkRateLimit('w', 1, 1_000).allowed).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit('w', 1, 1_000).allowed).toBe(true);
  });

  it('returns a positive retry-after only when blocked', () => {
    vi.useFakeTimers();
    expect(checkRateLimit('t', 1, 10_000).retryAfterSeconds).toBe(0);
    expect(checkRateLimit('t', 1, 10_000).retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe('clientIp', () => {
  it('takes the first entry of x-forwarded-for', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18, 150.172.238.178' },
    });
    expect(clientIp(request)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    const request = new Request('https://example.com', { headers: { 'x-real-ip': '203.0.113.9' } });
    expect(clientIp(request)).toBe('203.0.113.9');
  });

  it('buckets unidentifiable requests together rather than letting them through', () => {
    // The failure mode being guarded against is returning something unique
    // (a random id, a timestamp) for an unknown client, which would give
    // every header-stripped request its own fresh budget.
    const a = clientIp(new Request('https://example.com'));
    const b = clientIp(new Request('https://example.com'));
    expect(a).toBe('unknown');
    expect(b).toBe(a);
  });
});

describe('checkRateLimitPersistent', () => {
  beforeEach(() => {
    __resetRateLimits();
  });

  function mockSupabase(
    result: Awaited<ReturnType<RateLimitSupabase['rpc']>>,
  ): RateLimitSupabase & { rpc: ReturnType<typeof vi.fn> } {
    return { rpc: vi.fn().mockResolvedValue(result) };
  }

  it('passes the key/limit/window through as p_key/p_limit/p_window_ms', async () => {
    const supabase = mockSupabase({ data: [{ allowed: true, remaining: 4, retry_after_seconds: 0 }], error: null });
    await checkRateLimitPersistent(supabase, 'waitlist:1.2.3.4', 5, 60_000);
    expect(supabase.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_key: 'waitlist:1.2.3.4',
      p_limit: 5,
      p_window_ms: 60_000,
    });
  });

  it('maps the RPC row to camelCase RateLimitResult', async () => {
    const supabase = mockSupabase({ data: [{ allowed: false, remaining: 0, retry_after_seconds: 42 }], error: null });
    const result = await checkRateLimitPersistent(supabase, 'k', 5, 60_000);
    expect(result).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 42 });
  });

  it('falls back to the in-memory limiter when the RPC call errors', async () => {
    // A DB hiccup should degrade to best-effort, not throw and take the
    // endpoint down, and not silently allow everything through either.
    const supabase = mockSupabase({ data: null, error: { message: 'connection reset' } });
    const first = await checkRateLimitPersistent(supabase, 'fallback-key', 1, 60_000);
    const second = await checkRateLimitPersistent(supabase, 'fallback-key', 1, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });

  it('falls back to the in-memory limiter when the RPC returns no rows', async () => {
    const supabase = mockSupabase({ data: [], error: null });
    const result = await checkRateLimitPersistent(supabase, 'empty-rows', 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });
});
