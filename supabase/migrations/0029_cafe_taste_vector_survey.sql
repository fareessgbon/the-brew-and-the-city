-- Café taste-vector self-survey (/make-brew-better/cafe-taste-survey) — a
-- café answering the admin editor's own seven questions about itself,
-- landing in survey_responses like every other survey rather than a new
-- table, for the same reason 0026 gave job_application the same treatment:
-- reuses the review workflow (0023), soft delete (0024), and admin/export
-- routes for free instead of duplicating them for a fourth type.
--
-- Answers here never write straight to cafes — an admin reviews the
-- submission and applies it deliberately (see the admin bridge to
-- /admin/cafes/new), same as the café-partner survey never auto-creates a
-- Founding Partner. A public form writing directly into live café data
-- with no one looking at it first is exactly the failure mode this
-- project has otherwise been careful to avoid.

alter table public.survey_responses drop constraint if exists survey_responses_survey_check;

alter table public.survey_responses
  add constraint survey_responses_survey_check
  check (survey in ('cafe_partner', 'consumer', 'job_application', 'cafe_taste_vector'));
