-- Step 2 (admin console) schema additions.

-- Café editor: deactivation, contact/social, photos, price band, City Card
-- participation toggles, and partner-administration fields (contract dates,
-- monthly price, primary contact, marketing deliverables, lifecycle status).
-- partner_status stays the existing tier (listed/partner/featured/
-- founding_partner) — partner_lifecycle_status is a separate axis (is this
-- specific café's participation currently active, paused, downgraded, or
-- cancelled), matching §9 of the admin console spec.
alter table public.cafes
  add column if not exists is_active boolean not null default true,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists instagram_handle text,
  add column if not exists website_url text,
  add column if not exists price_band text check (price_band is null or price_band in ('$', '$$', '$$$')),
  add column if not exists photos text[] not null default '{}',
  add column if not exists stamps_enabled boolean not null default true,
  add column if not exists rewards_enabled boolean not null default true,
  add column if not exists contract_start_date date,
  add column if not exists contract_end_date date,
  add column if not exists monthly_price_cents integer,
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_email text,
  add column if not exists marketing_deliverables_owed text,
  add column if not exists partner_lifecycle_status text not null default 'active'
    check (partner_lifecycle_status in ('active', 'paused', 'downgraded', 'cancelled'));

-- Café attributes: the rest of §4's list (oat/gluten_free/wheelchair already
-- existed — oat doubles as "non-dairy options" per the existing matching
-- engine, so it isn't duplicated here).
alter table public.cafe_attributes
  add column if not exists wifi boolean not null default false,
  add column if not exists outlets boolean not null default false,
  add column if not exists outdoor_seating boolean not null default false,
  add column if not exists seating_notes text,
  add column if not exists noise_level text check (noise_level is null or noise_level in ('quiet', 'moderate', 'loud')),
  add column if not exists average_wait_minutes integer,
  add column if not exists food_program boolean not null default false,
  add column if not exists cash_accepted boolean not null default true;

-- §7 merchant-string manager. No OCR pipeline exists yet in this build — this
-- is the mapping table a future OCR step would read from, and what this
-- admin tool manages today: known receipt merchant-name variations and
-- which café each maps to. cafe_id null means "seen, not yet mapped."
create table if not exists public.merchant_strings (
  id          uuid primary key default gen_random_uuid(),
  raw_string  text not null unique,
  cafe_id     uuid references public.cafes(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists merchant_strings_cafe_id_idx on public.merchant_strings (cafe_id);

alter table public.merchant_strings enable row level security;

-- §10 reimbursement records. The actual amounts owed are already derivable
-- from rewards (status='redeemed') joined to reward_items.reimbursement_cents
-- — this table only tracks which redemptions have been paid out, not a
-- second copy of the financial data.
create table if not exists public.reimbursement_payments (
  id          uuid primary key default gen_random_uuid(),
  reward_id   uuid not null unique references public.rewards(id) on delete cascade,
  paid_at     timestamptz not null default now(),
  admin_email text not null
);

alter table public.reimbursement_payments enable row level security;

-- §11 feature flags — checked server-side (see lib/server/featureFlags.ts),
-- not just hidden in the UI.
create table if not exists public.feature_flags (
  key         text primary key,
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

alter table public.feature_flags enable row level security;

insert into public.feature_flags (key, enabled) values
  ('matching_feed', true),
  ('receipt_uploads', true),
  ('ocr_processing', true),
  ('automatic_receipt_approval', true),
  ('cafe_review_queue', true),
  ('reward_activation', true),
  ('reward_redemption', true),
  ('notifications', true)
on conflict (key) do nothing;

-- §12 audit log — add the structured actor/record/prev/new columns the spec
-- wants, alongside the existing human-readable summary/detail (migration
-- 0014) rather than replacing them.
alter table public.audit_log
  add column if not exists record_type text,
  add column if not exists record_id text,
  add column if not exists previous_value jsonb,
  add column if not exists new_value jsonb;
