-- Sending a rejection from the admin queue (POST
-- /api/admin/survey-responses/[id]/reject). The status column from 0023
-- already records the *decision* — this records the fact that the
-- applicant was actually told, which is a different thing: 'declined' can
-- be set by hand from the badge, and someone working a queue over several
-- sittings has no other way to tell "I decided no" from "they've heard
-- back". It's also what stops a second click from mailing the same person
-- twice.
--
-- Nullable with no default: existing rows genuinely haven't been sent one,
-- and that's exactly what null says here.

alter table public.survey_responses
  add column if not exists rejection_email_sent_at timestamptz;

-- No new RLS policy — survey_responses still has no public policy
-- (migration 0021's API-only pattern); only the service-role client behind
-- the PIN-gated /api/admin/* routes ever writes this column.
