-- Performance indexes identified in the production database audit. Postgres
-- auto-indexes primary keys and unique constraints only — a plain foreign-key
-- column used in a WHERE clause needs an explicit index, or every such query
-- is a full table scan. Every index below backs a real, currently-running
-- .eq(...) filter (see each block's comment for the call site).

-- visits — cafe_id: the admin café-delete history guard
-- (assertCafeHasNoHistory in app/admin/actions.ts). user_id: every City
-- Card read (getStampCard in lib/server/sixthRound.ts). status: the admin
-- backup review queue (/admin/visits) filters on status alone with no
-- other narrowing predicate — today that's a full table scan.
create index if not exists visits_cafe_id_idx on public.visits (cafe_id);
create index if not exists visits_user_id_idx on public.visits (user_id);
create index if not exists visits_status_idx on public.visits (status);

-- rewards — user_id: every City Card read (getStampCard,
-- ensureRewardIfEligible). pending_cafe_id: the redeem-at-counter lookup
-- and the café-delete history guard. redeemed_at_cafe_id: activateReward()'s
-- monthly redemption-cap check, which runs on every activation attempt, plus
-- the café-delete history guard.
create index if not exists rewards_user_id_idx on public.rewards (user_id);
create index if not exists rewards_pending_cafe_id_idx on public.rewards (pending_cafe_id);
create index if not exists rewards_redeemed_at_cafe_id_idx on public.rewards (redeemed_at_cafe_id);

-- reward_items — cafe_id: the 5-item cap check and a café's eligible-item
-- list, on both the admin and café-portal write paths, plus the
-- café-delete history guard.
create index if not exists reward_items_cafe_id_idx on public.reward_items (cafe_id);

-- cafe_feedback — user_id is already the leading column of the existing
-- (user_id, cafe_id, feedback) unique constraint, so it's partially served
-- via Postgres's leftmost-prefix rule; indexed here anyway as a purpose-built
-- lookup path (getMatchesForUser's "not it" exclusion, run on every match
-- read) rather than relying on a wider composite key. cafe_id has no
-- existing coverage at all — it isn't the constraint's leading column.
create index if not exists cafe_feedback_user_id_idx on public.cafe_feedback (user_id);
create index if not exists cafe_feedback_cafe_id_idx on public.cafe_feedback (cafe_id);
