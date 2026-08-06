-- §3.0.5 / §8.11 — cafés curate their own eligible-item list instead of a
-- flat "any drink" reward, and redemption becomes a café-specific,
-- time-limited activation instead of a permanent code good anywhere.

create table if not exists public.reward_items (
  id                    uuid primary key default gen_random_uuid(),
  cafe_id               uuid not null references public.cafes(id) on delete cascade,
  name                  text not null,
  description           text,
  category              text not null default 'drink' check (category in ('drink', 'pastry', 'food', 'other')),
  price_cents           int,
  reimbursement_cents   int not null default 400,
  monthly_cap           int, -- null = only the café-level cap (cafes.monthly_redemption_cap) applies
  is_available          boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.cafes
  add column monthly_redemption_cap int not null default 10;

-- code is no longer assigned at creation — a reward is "ready" the moment a
-- member hits 5 visits, but stays code-less until they activate it at a
-- specific participating café, which is when it becomes time-limited.
alter table public.rewards
  alter column code drop not null,
  add column pending_cafe_id uuid references public.cafes(id),
  add column reward_item_id uuid references public.reward_items(id),
  add column activated_at timestamptz,
  add column expires_at timestamptz;

alter table public.reward_items enable row level security;
create policy "reward_items are publicly readable" on public.reward_items for select using (true);
-- Writes go through the café portal's API routes using the service-role
-- key (portal auth is a signed PIN cookie, not Supabase Auth — see
-- lib/portalSession.ts) — no public write policy, matching cafe_attributes.
