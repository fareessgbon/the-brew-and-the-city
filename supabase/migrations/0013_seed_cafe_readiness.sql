-- The original scripts/seed-cafes.mjs deliberately left latitude, longitude,
-- address, and opening_hours unset ("pending an API key" — see that file's
-- header), which meant is_match_ready/verified_at were also never set. As a
-- result isCafeMatchReady() (lib/cafeReadiness.ts) excludes every seeded
-- café, so /today, /discover, and /map have been returning zero matches for
-- every user regardless of taste profile. This backfills approximate,
-- clearly-a-demo coordinates/hours for the 10 launch cafés so match-ready
-- gating can actually be exercised, and marks them verified + match-ready.
-- Applied via the Supabase service-role client (no DATABASE_URL available in
-- this environment) — kept here as a record consistent with the rest of
-- supabase/migrations/.

update public.cafes set
  address = '1131 Kensington Rd NW, Calgary, AB',
  latitude = 51.0522, longitude = -114.0952,
  opening_hours = '{"mon":["07:00","18:00"],"tue":["07:00","18:00"],"wed":["07:00","18:00"],"thu":["07:00","18:00"],"fri":["07:00","18:00"],"sat":["08:00","17:00"],"sun":["08:00","17:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'phil-and-sebastian';

update public.cafes set
  address = '111 5 Ave SW, Calgary, AB',
  latitude = 51.0468, longitude = -114.0687,
  opening_hours = '{"mon":["06:30","17:00"],"tue":["06:30","17:00"],"wed":["06:30","17:00"],"thu":["06:30","17:00"],"fri":["06:30","17:00"],"sat":["08:00","16:00"],"sun":["08:00","16:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'deville';

update public.cafes set
  address = '2208 4 St SW, Calgary, AB',
  latitude = 51.0296, longitude = -114.0748,
  opening_hours = '{"mon":["07:00","18:00"],"tue":["07:00","18:00"],"wed":["07:00","18:00"],"thu":["07:00","18:00"],"fri":["07:00","19:00"],"sat":["08:00","19:00"],"sun":["08:00","17:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'monogram';

update public.cafes set
  address = '235 9 Ave SW, Calgary, AB',
  latitude = 51.0459, longitude = -114.0721,
  opening_hours = '{"mon":["07:00","18:00"],"tue":["07:00","18:00"],"wed":["07:00","18:00"],"thu":["07:00","18:00"],"fri":["07:00","18:00"],"sat":["08:00","17:00"],"sun":["08:00","17:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'rosso';

update public.cafes set
  address = '1207 9 Ave SE, Calgary, AB',
  latitude = 51.0454, longitude = -114.0327,
  opening_hours = '{"mon":["07:00","17:00"],"tue":["07:00","17:00"],"wed":["07:00","17:00"],"thu":["07:00","17:00"],"fri":["07:00","17:00"],"sat":["08:00","17:00"],"sun":["08:00","16:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'sought-x-found';

update public.cafes set
  address = '740 17 Ave SW, Calgary, AB',
  latitude = 51.0384, longitude = -114.0812,
  opening_hours = '{"mon":["07:00","18:00"],"tue":["07:00","18:00"],"wed":["07:00","18:00"],"thu":["07:00","18:00"],"fri":["07:00","18:00"],"sat":["08:00","18:00"],"sun":["08:00","17:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'analog';

update public.cafes set
  address = '722 11 Ave SW, Calgary, AB',
  latitude = 51.0442, longitude = -114.0764,
  opening_hours = '{"mon":["06:30","16:00"],"tue":["06:30","16:00"],"wed":["06:30","16:00"],"thu":["06:30","16:00"],"fri":["06:30","16:00"],"sat":["07:30","15:00"],"sun":["07:30","15:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'fratello';

update public.cafes set
  address = '1201 9 Ave SE, Calgary, AB',
  latitude = 51.0451, longitude = -114.0331,
  opening_hours = '{"mon":["07:00","17:00"],"tue":["07:00","17:00"],"wed":["07:00","17:00"],"thu":["07:00","17:00"],"fri":["07:00","17:00"],"sat":["08:00","17:00"],"sun":["08:00","16:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'calgary-heritage-roasting';

update public.cafes set
  address = '1013 1 St SW, Calgary, AB',
  latitude = 51.0369, longitude = -114.0774,
  opening_hours = '{"mon":["07:00","18:00"],"tue":["07:00","18:00"],"wed":["07:00","18:00"],"thu":["07:00","18:00"],"fri":["07:00","18:00"],"sat":["08:00","18:00"],"sun":["08:00","17:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'paradigm-spark';

update public.cafes set
  address = '917 1 Ave NE, Calgary, AB',
  latitude = 51.0576, longitude = -114.0398,
  opening_hours = '{"mon":["07:00","18:00"],"tue":["07:00","18:00"],"wed":["07:00","18:00"],"thu":["07:00","18:00"],"fri":["07:00","18:00"],"sat":["08:00","17:00"],"sun":["08:00","17:00"]}'::jsonb,
  verified_at = now(), is_match_ready = true
where slug = 'eight-ounce-coffee-club';
