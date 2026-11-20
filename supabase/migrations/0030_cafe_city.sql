-- Adds Toronto as a second café market alongside Calgary. Every existing
-- café is Calgary (the only market until now), so the default backfills all
-- 15 rows correctly with no separate update needed. A check constraint, not
-- free text, since this drives filtering (admin list, seed script, future
-- Discover city scoping) rather than just display — same pattern as
-- partner_status in 0001_init.sql.
alter table public.cafes
  add column city text not null default 'calgary'
    check (city in ('calgary', 'toronto'));
