-- §7.1a / Appendix A v3.1 — primary drink category (categorical, not a
-- vector axis) plus the post-quiz dietary/accessibility requirements
-- screen. Cafes default to serving every category so existing seed data
-- doesn't silently vanish from results until an admin narrows it down;
-- dietary/accessibility flags default to false (cafe_attributes already
-- does, from 0001) since claiming an unverified accommodation is worse
-- than a request quietly turning up nothing yet.

alter table public.cafes
  add column drink_categories text[] not null default array['coffee','matcha','tea_chai','refreshers_other'];

alter table public.taste_profiles
  add column primary_drink_category text check (primary_drink_category in ('coffee','matcha','tea_chai','refreshers_other')),
  add column needs_non_dairy boolean not null default false,
  add column needs_gluten_free boolean not null default false,
  add column needs_wheelchair boolean not null default false;
