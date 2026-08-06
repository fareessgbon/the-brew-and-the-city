alter table public.taste_profiles
  add column worth_the_trip boolean not null default false,
  add column home_latitude double precision,
  add column home_longitude double precision,
  add column home_neighbourhood text;
