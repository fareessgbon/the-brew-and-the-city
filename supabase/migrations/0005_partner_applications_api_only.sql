-- Partner applications now go through POST /api/partner-applications (which
-- uses the service-role key and does real validation: email format,
-- Instagram length, duplicate/frequency checks). Drop the old public insert
-- policy so the anon key can no longer write here directly, bypassing that
-- validation.
drop policy if exists "anyone can submit a partner application" on public.partner_applications;
