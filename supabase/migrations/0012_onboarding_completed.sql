-- Onboarding completion is now an explicit flag rather than something every
-- caller has to re-derive from "does a taste_profiles row exist" — set true
-- at the true end of the flow (location step), read by every page that
-- requires a finished profile to be useful.
alter table public.taste_profiles
  add column onboarding_completed boolean not null default false;

-- Backfill: everyone with an existing taste_profiles row already finished
-- the quiz in practice — don't force them back through onboarding.
update public.taste_profiles set onboarding_completed = true;
