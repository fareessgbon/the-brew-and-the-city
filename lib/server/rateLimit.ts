// Best-effort in-process rate limiting, plus a persistent variant below.
//
// **Read this before relying on checkRateLimit() alone.** State lives in
// the memory of one server instance. On a platform that runs several
// instances (or scales serverless functions to zero between requests) the
// effective limit is "N per window per warm instance", not a hard global
// cap.
//
// This build has no portal PIN or receipt uploads — its three public write
// endpoints (waitlist, both surveys) are the whole attack surface, and a
// flood of any of them is exactly the case checkRateLimit() alone doesn't
// cover on serverless. checkRateLimitPersistent() below closes that gap via
// the rate_limit_buckets table (migration 0022) — one DB round-trip per
// request, acceptable here since these are human-triggered form submits,
// not a hot path. Use it for anything actually exposed to the public
// internet; keep checkRateLimit() for anything genuinely cheap and
// low-stakes, or as a synchronous pre-check before the DB round-trip.

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

// Structural, not the generated Database type — this file is a generic
// infra util and shouldn't need to import the full Supabase client just to
// describe the one RPC call it makes. Any client with an `rpc` method
// (real or mocked in a test) satisfies this.
export interface RateLimitSupabase {
  rpc: (
    fn: 'check_rate_limit',
    args: { p_key: string; p_limit: number; p_window_ms: number },
    // PromiseLike, not Promise — the real client's .rpc() returns a
    // thenable query builder, not a literal Promise, though `await` treats
    // them the same.
  ) => PromiseLike<{
    data: Array<{ allowed: boolean; remaining: number; retry_after_seconds: number }> | null;
    error: unknown;
  }>;
}

// The persistent counterpart to checkRateLimit() — same signature plus a
// client, backed by the rate_limit_buckets table (migration 0022) so the
// limit holds across instances and cold starts, not just within one warm
// process. Falls back to the in-memory check on any DB error: a Supabase
// hiccup should degrade this to best-effort, not take the endpoint down or
// (worse) silently stop limiting anything.
export async function checkRateLimitPersistent(
  supabase: RateLimitSupabase,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_ms: windowMs,
  });

  const row = data?.[0];
  if (error || !row) {
    return checkRateLimit(key, limit, windowMs);
  }

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    retryAfterSeconds: row.retry_after_seconds,
  };
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
