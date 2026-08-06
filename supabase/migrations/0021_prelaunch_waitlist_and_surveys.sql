-- Pre-launch site (spec §0.4) — the entire technical footprint this phase
-- needs: one waitlist table and one survey-responses table. No accounts, no
-- auth, no cafes, no matching — those all belong to the real product, which
-- this phase deliberately doesn't ship yet.
--
-- Shares the live product's Supabase project (deliberate — see chat) rather
-- than a separate one, so these rows sit right next to real product data
-- for whenever the full app launches. Nothing in the pre-launch site's
-- routes can reach any of that data; it's a completely different set of
-- pages hitting only these two tables.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  created_at  timestamptz not null default now()
);
-- One row per email — a repeat signup is a no-op, not a duplicate. Case-
-- insensitive so "Person@Example.com" and "person@example.com" collide.
create unique index if not exists waitlist_email_idx on public.waitlist (lower(email));

create table if not exists public.survey_responses (
  id          uuid primary key default gen_random_uuid(),
  survey      text not null check (survey in ('cafe_partner', 'consumer')),
  answers     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists survey_responses_survey_idx on public.survey_responses (survey, created_at desc);

alter table public.waitlist enable row level security;
alter table public.survey_responses enable row level security;

-- No public policies on either table — same "API-only" pattern already
-- established for partner_applications (migration 0005) and visits
-- (migration 0020): POST /api/waitlist and POST /api/surveys/* validate the
-- request server-side (email format, required survey fields, rate limits)
-- and insert via the service-role client. A direct anon-key insert is
-- refused by RLS with no matching policy, not silently allowed.
