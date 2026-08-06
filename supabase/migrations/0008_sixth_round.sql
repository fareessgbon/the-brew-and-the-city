-- The Sixth Round: receipt-verified stamps, a 5-stamp reward, and a
-- PIN-gated café portal to review receipts and redeem rewards. Café portal
-- access is a PIN, not a Supabase Auth account (matches §21: "no POS
-- integration, no new hardware — a web page and a PIN") — portal sessions
-- are verified by a signed cookie checked in application code, not by RLS,
-- so every portal-facing route uses the service-role client after checking
-- that cookie. RLS below only needs to cover what real Supabase Auth users
-- (consumers) do directly from the browser.

alter table public.cafes
  add column portal_pin text;

alter table public.visits
  add column status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  add column receipt_hash text,
  add column reviewed_at timestamptz,
  add column reviewed_by text; -- 'cafe' | 'admin' — who actioned it, not a user id (portal has no per-staff identity)

-- Duplicate detection: the exact same receipt photo can't be used twice.
create unique index if not exists visits_receipt_hash_idx on public.visits (receipt_hash) where receipt_hash is not null;

-- A reward is created the moment a member becomes eligible (5 unconsumed,
-- non-expired, max-2-per-café stamps) — not invented fresh at redemption
-- time — so the 5 stamps that earned it can be locked (see visits.reward_id
-- below) and can't also count toward a second reward while this one sits
-- unredeemed.
create table if not exists public.rewards (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  code                  text not null unique,
  status                text not null default 'active' check (status in ('active', 'redeemed')),
  redeemed_at_cafe_id   uuid references public.cafes(id),
  created_at            timestamptz not null default now(),
  redeemed_at           timestamptz
);

alter table public.visits
  add column reward_id uuid references public.rewards(id);

alter table public.rewards enable row level security;
create policy "users can view their own rewards" on public.rewards
  for select using (auth.uid() = user_id);
-- Inserts/updates (creating a reward, redeeming it) go through
-- POST /api/rewards and POST /api/portal/redeem using the service-role
-- client — no public write policy, same reasoning as partner_applications.

-- ============================================================================
-- Storage: a private bucket for receipt photos.
-- §20 — never public; visible only to the uploader, the café in its queue,
-- and admin; purged 30 days after resolution (see the admin "Purge old
-- receipts" action, since this environment has no scheduled-job runner).
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Consumers upload to receipts/{their own user id}/... and can read their
-- own receipts back; nothing else is exposed via RLS — café/admin access to
-- other members' receipts happens server-side via the service-role client,
-- which bypasses RLS, gated by the portal-session check in application code.
create policy "users can upload their own receipts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can view their own receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
