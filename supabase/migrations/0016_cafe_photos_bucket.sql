-- Storage: a public bucket for café photos (admin console §2 "Add photos").
-- Unlike receipts, these are meant to be shown publicly on a café's profile,
-- so the bucket itself is public-read. Writes only ever happen via the
-- admin Server Actions' service-role client, which bypasses RLS — no public
-- insert policy is needed or added.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cafe-photos', 'cafe-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
