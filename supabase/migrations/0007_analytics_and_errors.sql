-- First-party analytics + error logging. PostHog (build step 12) is still
-- blocked on an API key only the site owner can create — rather than leave
-- analytics as a no-op stub until that exists, these events are real and
-- queryable today. If/when a PostHog key shows up, dispatch to both from
-- the same lib/analytics.ts call site rather than replacing this.
create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null,
  user_id     uuid references public.users(id) on delete set null,
  properties  jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists analytics_events_event_idx on public.analytics_events (event, created_at desc);

create table if not exists public.error_logs (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null,
  message     text not null,
  detail      jsonb,
  user_id     uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists error_logs_scope_idx on public.error_logs (scope, created_at desc);

alter table public.analytics_events enable row level security;
alter table public.error_logs enable row level security;

-- No public policies on either table — both are written exclusively via the
-- service-role client (POST /api/analytics/track validates the event name
-- and inserts server-side; server code logs errors directly), same pattern
-- as partner_applications after migration 0005. Read access is admin-only,
-- via the service-role key in the admin dashboard.
