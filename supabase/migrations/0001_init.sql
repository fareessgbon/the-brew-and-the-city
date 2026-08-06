-- Matcha Matchup — initial schema.
-- Not yet applied anywhere: this repo has no live Supabase project (Docker
-- wasn't installable in the dev environment — no admin/sudo access; see
-- lib/supabase/README.md). Run with `supabase db reset` or
-- `supabase migration up` once a project (local or hosted) exists.

create extension if not exists "pgcrypto";

-- ============================================================================
-- cafes
-- ============================================================================
create table if not exists public.cafes (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  address           text,
  latitude          double precision,
  longitude         double precision,
  neighbourhood     text,
  opening_hours     jsonb,                 -- { "mon": ["07:00","18:00"], ... }

  -- Taste vector, 0–100 each — see lib/matching/constants.ts DIMS. Kept as
  -- individual columns (not a jsonb blob) so admin/vector-tester and CSV
  -- import can validate and query on them directly.
  drink_score       smallint not null default 50 check (drink_score between 0 and 100),
  energy_score      smallint not null default 50 check (energy_score between 0 and 100),
  aesthetic_score   smallint not null default 50 check (aesthetic_score between 0 and 100),
  pace_score        smallint not null default 50 check (pace_score between 0 and 100),
  adventure_score   smallint not null default 50 check (adventure_score between 0 and 100),
  price_score       smallint not null default 50 check (price_score between 0 and 100),
  food_score        smallint not null default 50 check (food_score between 0 and 100),

  -- §5.1 firewall: this column may change what surfaces a café appears on
  -- (promotion, Sixth Round eligibility) — it must never be read by anything
  -- in lib/matching. calculateMatch()'s input type has no field for it at all.
  partner_status    text not null default 'listed'
                       check (partner_status in ('listed', 'partner', 'featured', 'founding_partner')),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.cafes.partner_status is
  'Controls visibility/promotion only. NEVER read by lib/matching — see §5.1.';

-- ============================================================================
-- users  (profile row alongside Supabase Auth's auth.users)
-- ============================================================================
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  email         text not null,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- taste_profiles  (one active profile per user; quiz answers feed this)
-- ============================================================================
create table if not exists public.taste_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,

  drink           smallint not null default 50 check (drink between 0 and 100),
  energy          smallint not null default 50 check (energy between 0 and 100),
  aesthetic       smallint not null default 50 check (aesthetic between 0 and 100),
  pace            smallint not null default 50 check (pace between 0 and 100),
  adventure       smallint not null default 50 check (adventure between 0 and 100),
  price           smallint not null default 50 check (price between 0 and 100),
  food            smallint not null default 50 check (food between 0 and 100),

  answered_dims   text[] not null default '{}',      -- which dims came from real answers
  go_to_cafe_id   uuid references public.cafes(id),
  radius_km       numeric not null default 12,        -- §1.5 — car-city default

  updated_at      timestamptz not null default now(),
  unique (user_id)
);

-- ============================================================================
-- cafe_attributes  (hard filters, not scored — see passesFilters in the demo)
-- ============================================================================
create table if not exists public.cafe_attributes (
  cafe_id       uuid primary key references public.cafes(id) on delete cascade,
  oat           boolean not null default false,
  gluten_free   boolean not null default false,
  wheelchair    boolean not null default false
);

-- ============================================================================
-- menu_items
-- ============================================================================
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  cafe_id       uuid not null references public.cafes(id) on delete cascade,
  name          text not null,
  description   text,
  price_cents   integer check (price_cents >= 0),
  category      text check (category in ('matcha', 'coffee', 'tea', 'food', 'other')),
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- saved_cafes
-- ============================================================================
create table if not exists public.saved_cafes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  cafe_id       uuid not null references public.cafes(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, cafe_id)
);

-- ============================================================================
-- visits  (Sixth Round stamps + the match_visited analytics event)
-- ============================================================================
create table if not exists public.visits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  cafe_id             uuid not null references public.cafes(id) on delete cascade,
  match_pct           smallint check (match_pct between 0 and 100),
  visited_at          timestamptz not null default now(),
  -- §20: receipt images purge 30 days after resolution — store only the
  -- storage path (and only until purge), never treat this as a permanent record.
  receipt_image_path  text,
  stamp_awarded       boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ============================================================================
-- partner_applications
-- ============================================================================
create table if not exists public.partner_applications (
  id             uuid primary key default gen_random_uuid(),
  cafe_name      text not null,
  email          text not null,
  neighbourhood  text not null,
  instagram      text,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at     timestamptz not null default now()
);

-- Duplicate-email protection for pending applications — see build step 11.
create unique index if not exists partner_applications_pending_email_idx
  on public.partner_applications (lower(email))
  where status = 'pending';

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.cafes                enable row level security;
alter table public.cafe_attributes      enable row level security;
alter table public.menu_items           enable row level security;
alter table public.users                enable row level security;
alter table public.taste_profiles       enable row level security;
alter table public.saved_cafes          enable row level security;
alter table public.visits               enable row level security;
alter table public.partner_applications enable row level security;

-- Public, read-only catalogue data.
create policy "cafes are publicly readable" on public.cafes for select using (true);
create policy "cafe_attributes are publicly readable" on public.cafe_attributes for select using (true);
create policy "menu_items are publicly readable" on public.menu_items for select using (true);

-- Writes to catalogue tables go through the admin dashboard's API routes
-- using the service-role key (which bypasses RLS) — no public write policy.

-- Users can read/update only their own profile row.
create policy "users can view their own profile" on public.users
  for select using (auth.uid() = id);
create policy "users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "users can manage their own taste profile" on public.taste_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can manage their own saved cafes" on public.saved_cafes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can view their own visits" on public.visits
  for select using (auth.uid() = user_id);
create policy "users can insert their own visits" on public.visits
  for insert with check (auth.uid() = user_id);

-- Anyone can submit a partner application; only admins (service role) can read/update them.
create policy "anyone can submit a partner application" on public.partner_applications
  for insert with check (true);
