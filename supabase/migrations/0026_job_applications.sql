-- Careers (/careers) — job applications land in survey_responses rather
-- than a new table. They want exactly what the café survey already has: a
-- jsonb answer blob, a status the founder works through (new → contacted →
-- selected → declined), admin notes, soft delete, CSV export. Adding a
-- third `survey` value reuses all of that; a parallel job_applications
-- table would have duplicated the review workflow (0023), the soft delete
-- (0024) and the admin/export routes for no gain.
--
-- The inline check from 0021 is named survey_responses_survey_check by
-- Postgres convention (<table>_<column>_check) — dropped and re-added
-- rather than altered, since a check constraint has no ALTER form.

alter table public.survey_responses drop constraint if exists survey_responses_survey_check;

alter table public.survey_responses
  add constraint survey_responses_survey_check
  check (survey in ('cafe_partner', 'consumer', 'job_application'));

-- No new RLS policy: survey_responses still has no public policy at all
-- (0021's API-only pattern). POST /api/careers/apply validates server-side
-- and inserts with the service-role client, same as the two surveys.
