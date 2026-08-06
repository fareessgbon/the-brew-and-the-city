-- §3.0 — Founding Partner is a time-limited launch offer (6 months free,
-- then $49/mo or downgrade), not a permanent tier, so cafés on it need a
-- start date to count down from.
alter table public.cafes
  add column founding_partner_started_at timestamptz;
