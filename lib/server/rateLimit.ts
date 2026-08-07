// Best-effort in-process rate limiting.
//
// **Read this before relying on it.** State lives in the memory of one
// server instance. On a platform that runs several instances (or scales
// serverless functions to zero between requests) the effective limit is
// "N per window per warm instance", not a hard global cap. That is a
// deliberate trade-off, not an oversight: the alternative is a Redis/Upstash
// dependency this project doesn't have, or a database round-trip on every
// single request to endpoints whose whole point is being cheap.
//
// So: use this to blunt floods and casual abuse. Where a limit is actually
// load-bearing for money or account security — the café portal PIN, receipt
// uploads — there is a *second*, database-backed check that survives a cold
// start. This is the fast first line, never the only one.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Stops the Map growing without bound on a long-lived instance. Called on
// each check rather than on a timer, so it can't keep a process alive.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds };
}

// Every caller identifies clients the same way, so the fallback for a
// missing header is consistent too: an unknown-IP request shares one bucket
// with every other unknown-IP request rather than getting a free pass.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

// Exported for tests — resets state between cases.
export function __resetRateLimits() {
  buckets.clear();
}
