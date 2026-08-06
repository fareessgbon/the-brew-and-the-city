# Production setup checklist

Generated from a direct audit of the live Supabase project (via its REST/Storage
APIs) and the codebase's actual `process.env` reads — not assumptions from the
migration files' own comments. Re-verify by querying `public._migrations`
directly (see §1) if you suspect drift.

## 1. Database migrations

**Status as of this check: 17 of 19 migrations applied. Two are not.**

| Migration | Live status |
|---|---|
| `0001_init.sql` → `0017_visit_auto_check_reason.sql` | ✅ Applied |
| `0018_performance_indexes.sql` | ❌ **Not applied** — adds indexes on `visits.{cafe_id,user_id,status}`, `rewards.{user_id,pending_cafe_id,redeemed_at_cafe_id}`, `reward_items.cafe_id`, `cafe_feedback.{user_id,cafe_id}` |
| `0019_partner_application_onboarding.sql` | ❌ **Not applied** — adds `partner_applications.cafe_id` and `cafes.onboarding_status` |

**This blocks a real feature right now**: `approveApplication()` in
`app/admin/actions.ts` already reads/writes `cafes.onboarding_status` and
`partner_applications.cafe_id`. Deploying today's code against today's
live schema would make partner-application approval fail with a Postgres
"column does not exist" error the first time an admin tries it.

**To apply**, run against the live project (needs the Postgres connection
string, *not* the Supabase API keys already in `.env.local`):

```bash
DATABASE_URL=postgresql://postgres:<password>@<host>:<port>/postgres node scripts/run-migration.mjs
```

This only applies what's missing — it tracks applied migrations in its own
`public._migrations` table and is idempotent to re-run.

**How this was verified**: queried `public._migrations` (the tracking table
`run-migration.mjs` maintains) directly via the project's REST API, and
diffed the filenames against everything in `supabase/migrations/`.

## 2. Required tables

All 17 core tables (`analytics_events`, `audit_log`, `cafe_attributes`,
`cafe_feedback`, `cafes`, `error_logs`, `feature_flags`, `menu_items`,
`merchant_strings`, `partner_applications`, `reimbursement_payments`,
`reward_items`, `rewards`, `saved_cafes`, `taste_profiles`, `users`,
`visits`) exist on the live project and their columns match
`lib/supabase/types.ts` exactly, except for the two columns pending in
`0019` above. Both Storage buckets exist and are configured correctly:

| Bucket | Public | Size limit | Allowed types |
|---|---|---|---|
| `receipts` | No (private, signed URLs) | 8 MB | jpeg, png, webp, heic |
| `cafe-photos` | Yes | 8 MB | jpeg, png, webp |

RLS is enabled on every table and was verified **behaviorally** (not just
by reading the migration SQL): tables with real rows in them return those
rows via the service-role key but return zero via the anon key when no
public-read policy exists (`audit_log`, `feature_flags`, `merchant_strings`,
`rewards`, etc.) — confirming RLS is actually filtering live data, not
coincidentally empty tables.

## 3. Database performance

`0018_performance_indexes.sql` (pending — see §1) adds indexes on every
column a real, currently-running query filters on directly with no other
narrowing predicate. No further indexes are recommended at this time —
adding more without a demonstrated query pattern would be speculative.

## 4. Environment variables

### Required to run the app

| Variable | Where it's read | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/{client,server,middleware}.ts` | Project URL — public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | Anon key — public by design, protected by RLS not secrecy |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/server.ts`, `lib/portalSession.ts` | **Server-only.** Verified: referenced in exactly two files, neither is a Client Component. Bypasses RLS entirely — never expose this. |
| `ADMIN_EMAILS` | `lib/admin.ts` | Comma-separated allowlist for `/admin/**`. No allowlist = nobody can reach the admin console. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `components/map/CafeMap.tsx` | **Must be a public token** (starts `pk.`) — this is bundled into client JS. `/map` degrades to a working café list without it (see Phase 3). |
| `NEXT_PUBLIC_SITE_URL` | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` | **New in Phase 13.** The real production domain — drives `metadataBase`, Open Graph tags, and the sitemap's absolute URLs. Falls back to `http://localhost:3000` if unset, so nothing breaks in dev, but **must be set to the real domain before launch** or every shared link's preview and the sitemap will point at localhost. |

### Not required, don't add

- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` — **removed from
  `.env.local.example` this phase.** Zero references anywhere in the
  codebase; analytics is homegrown (`/api/analytics/track` →
  `analytics_events` table), not PostHog.
- `SUPABASE_JWKS_URL` — removed in a previous session (also zero
  references; likely copied from the Supabase dashboard preemptively and
  never wired to anything).
- `DATABASE_URL` — deliberately **not** stored in `.env.local` at all. It's
  only used ad hoc, inline, for `scripts/run-migration.mjs` and
  `scripts/seed-cafes.mjs`, both of which say so in their own header
  comments ("never written to disk"). Keep it that way — don't add it to
  the env files.

### Secret-exposure check performed

- `.env*` is gitignored (with an explicit `!.env.local.example` exception)
  — confirmed no `.env.local` is tracked in git history.
- No hardcoded API keys/tokens found anywhere in the codebase (checked for
  common secret patterns — `sk_live`, AWS keys, private-key blocks, raw
  JWTs).
- `SUPABASE_SERVICE_ROLE_KEY` confirmed server-only (see table above).

## 5. Before deploying to production

- [ ] Apply `0018` and `0019` (see §1) — **do this before deploying
      current `main`**, or the partner-onboarding feature will break on
      first use.
- [ ] Decide whether the current live Supabase project (which has real
      test data — 11 cafés, 2 users, etc. as of the last audit) becomes
      production, or gets wiped/replaced. If it becomes production,
      rotate `SUPABASE_SERVICE_ROLE_KEY` since it's been in a dev-time
      `.env.local`.
- [ ] Get a real `NEXT_PUBLIC_MAPBOX_TOKEN` (public token) or accept the
      café-list fallback for launch (see Phase 3 recommendation).
- [ ] Set `ADMIN_EMAILS` to the real admin allowlist for production, not
      whatever was used during development.
- [ ] CI (`.github/workflows/ci.yml`) runs lint/typecheck/tests on every
      push and PR — confirm it's green on `main` before deploying.

This checklist covers database + environment readiness only (Phase 1's
scope). Security, performance, and operational readiness (backups,
monitoring, rate limiting) get their own full pass in Phase 10.
