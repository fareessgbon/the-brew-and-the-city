-- Admin review workflow for survey_responses (migration 0021) — "similar
-- to the launch site admin" (see chat): a status + notes per submission,
-- so the café-partner survey responses can actually be worked like an
-- application queue instead of a static read-only list. Consumer survey
-- rows get the same columns for schema simplicity but the admin UI only
-- exposes the workflow on café_partner rows — consumer responses are
-- anonymous, aggregate signal, not individual applications to action.

alter table public.survey_responses
  add column if not exists status text not null default 'new'
    check (status in ('new', 'contacted', 'selected', 'declined')),
  add column if not exists admin_notes text;

create index if not exists survey_responses_status_idx on public.survey_responses (status);

-- No new RLS policy needed — survey_responses already has no public
-- policy (migration 0021's API-only pattern); only the service-role
-- client used by /api/admin/* ever touches these two columns.
