-- Waitlist gains the city someone signed up from.
--
-- Nullable: rows created before this migration have none, and the API keeps
-- accepting a signup without one (it retries the insert without the column
-- if this migration hasn't been applied yet). Same check constraint as
-- cafes.city (0030) so the two can be joined and filtered on the same values.
alter table public.waitlist
  add column if not exists city text
    check (city in ('calgary', 'toronto'));
