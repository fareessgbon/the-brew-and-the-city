alter table public.cafes
  add column verified_at timestamptz,
  add column is_match_ready boolean not null default false;
