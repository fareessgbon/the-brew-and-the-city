-- Partner onboarding — approving a Founding Partner application now creates
-- the café record automatically instead of leaving that as a fully manual
-- follow-up disconnected from the application that prompted it.

-- One-directional: partner_applications -> cafes. The reverse question
-- ("which application created this café?") is already answerable by
-- querying partner_applications where cafe_id = <id>; a second FK back
-- from cafes would just be redundant.
alter table public.partner_applications
  add column cafe_id uuid references public.cafes(id) on delete set null;
  -- on delete set null: café deletion is already guarded elsewhere against
  -- anything with real history, but if a genuinely-empty auto-created café
  -- is ever deleted, the application record should survive as history
  -- rather than vanishing or blocking the delete.

-- Onboarding status lives on cafes, not the application — it describes the
-- café's own setup progress. Defaults to 'active' (not 'pending') because
-- every café created through the normal admin "New café" form is already
-- fully admin-managed from the start; only a café auto-created from an
-- approved application is explicitly inserted with 'pending_portal_setup'.
alter table public.cafes
  add column onboarding_status text not null default 'active'
    check (onboarding_status in ('pending_portal_setup', 'active'));
