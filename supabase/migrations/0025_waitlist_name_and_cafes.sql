-- Waitlist gains a name and the cafés someone already loves.
--
-- Both nullable, deliberately. Migration 0021 shipped an email-only table
-- and rows already exist under that contract; making either column NOT NULL
-- would either fail against those rows or force a backfill of invented data.
-- They're optional in the form too — an email is still the only thing the
-- waitlist actually needs, and asking for more should never cost a signup.
--
-- go_to_cafes is free text, not a reference to public.cafes. At this stage
-- someone typing "Rosso, Phil & Sebastian, that place on 17th" is more
-- useful than a constrained picker: it tells us which cafés people name
-- unprompted, including ones not in the seed data, which is exactly the
-- signal a pre-launch list is for.

alter table public.waitlist
  add column if not exists name         text,
  add column if not exists go_to_cafes  text;

-- The unique index stays on lower(email) alone (0021). A repeat signup is
-- still a no-op rather than a second row, so someone re-submitting with a
-- name added does not create a duplicate — see the API route, which now
-- upgrades the existing row instead of silently discarding the new details.
