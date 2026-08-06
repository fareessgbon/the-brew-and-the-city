-- "Not it" feedback on a shown match — not in the original 8-table list, but
-- POST /api/feedback/not-it (build step 8) needs somewhere real to write to.
-- Kept minimal: this is a signal to act on later (suppress from future
-- matches, review in aggregate), not yet wired into the matching algorithm.
create table if not exists public.cafe_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  cafe_id     uuid not null references public.cafes(id) on delete cascade,
  feedback    text not null check (feedback in ('not_it')),
  created_at  timestamptz not null default now(),
  unique (user_id, cafe_id, feedback)
);

alter table public.cafe_feedback enable row level security;

create policy "users can manage their own feedback" on public.cafe_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
