-- Storage: resume uploads for /careers applications.
--
-- Private, unlike the cafe-photos bucket (migration 0016). That one is
-- public-read because its whole purpose is to be shown on a café profile;
-- a resume is the opposite — someone's name, phone number, address and
-- work history, handed over for one purpose. A public bucket would make
-- every uploaded resume readable by anyone who guessed the URL, with no
-- login and no audit trail. The admin page reads them through short-lived
-- signed URLs instead.
--
-- No insert policy: uploads only ever happen through POST /api/careers/apply
-- using the service-role client, which bypasses RLS — the same API-only
-- pattern as waitlist, survey_responses and cafe-photos. A direct anon-key
-- upload finds no policy and is refused.
--
-- file_size_limit and allowed_mime_types are enforced by Postgres here as
-- well as in the route, so a bug or a direct service-role call can't put a
-- 400 MB video in the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880, -- 5 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
