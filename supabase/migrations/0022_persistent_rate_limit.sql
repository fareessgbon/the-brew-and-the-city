-- Closes the gap documented at the top of lib/server/rateLimit.ts: the
-- in-memory limiter is per-instance, so on Vercel's serverless platform a
-- flood spread across cold starts sees "N per window per instance," not a
-- real global cap. This table + function give the three public write
-- endpoints (waitlist, both surveys) a limit that survives across
-- instances and cold starts, at the cost of one DB round-trip per
-- request — acceptable here since these are human-triggered form
-- submits, not a hot path.

create table if not exists public.rate_limit_buckets (
  key         text primary key,
  count       integer not null default 0,
  reset_at    timestamptz not null
);

-- No RLS policies at all — same "API-only" pattern as waitlist/
-- survey_responses (migration 0021). Only ever touched via the
-- service-role client inside check_rate_limit below.
alter table public.rate_limit_buckets enable row level security;

-- Atomic check-and-increment in one statement, so two concurrent requests
-- racing on the same key (two instances, same IP, same millisecond) can't
-- both read "count=0" and both get allowed — the same class of bug this
-- codebase already fixed once for café approval and reward activation
-- (see chat). security definer so callers only need EXECUTE, not table
-- access.
create or replace function public.check_rate_limit(p_key text, p_limit int, p_window_ms int)
returns table(allowed boolean, remaining int, retry_after_seconds int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now       timestamptz := clock_timestamp();
  v_count     int;
  v_reset_at  timestamptz;
begin
  insert into public.rate_limit_buckets as b (key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  on conflict (key) do update
    set count = case when b.reset_at <= v_now then 1 else b.count + 1 end,
        reset_at = case when b.reset_at <= v_now
                        then v_now + make_interval(secs => p_window_ms / 1000.0)
                        else b.reset_at end
  returning b.count, b.reset_at into v_count, v_reset_at;

  return query select
    (v_count <= p_limit) as allowed,
    greatest(p_limit - v_count, 0) as remaining,
    greatest(1, ceil(extract(epoch from (v_reset_at - v_now))))::int as retry_after_seconds;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to service_role;
