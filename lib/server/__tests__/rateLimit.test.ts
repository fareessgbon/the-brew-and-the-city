import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetRateLimits, checkRateLimit, clientIp } from '../rateLimit';

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
