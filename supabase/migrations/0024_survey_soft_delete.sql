-- Soft delete for survey_responses — direct response to real data being
-- lost during testing of the hard-delete admin feature (see chat). A row
-- is now hidden from the admin view by setting deleted_at, never actually
-- destroyed. There's no restore UI yet (out of scope for this fix), but
-- the data survives, which a hard DELETE never let it do.

alter table public.survey_responses
  add column if not exists deleted_at timestamptz;

create index if not exists survey_responses_deleted_at_idx on public.survey_responses (deleted_at)
  where deleted_at is null;
