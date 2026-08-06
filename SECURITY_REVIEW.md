# Security and scaling review

Phase 15 output — the final consolidated engineering review before launch.

**This document covers two passes.** The first (Pass 1) reviewed
authentication, database, application and infrastructure broadly. The second
(Pass 2) went back through the RLS policies and the analytics write path
line by line and found three issues Pass 1 missed, one of them critical.
Both are recorded below; nothing from Pass 1 was deleted.

Where a finding was already established and fixed in an earlier phase, it's
summarized with a pointer rather than re-investigated.

**Scope note:** this is a code and configuration review, not a penetration
test. Nothing here was tested against a live deployment.

**Verification:** `npm run lint` clean, `npx tsc --noEmit` clean.
`npx vitest run` could not execute in the Pass 2 environment (npm registry
unreachable, so the missing `@rolldown/binding-wasm32-wasi` native binding
couldn't be installed) — CI (`.github/workflows/ci.yml`) is the source of
truth for the test run. Two test files were added in Pass 2.

---

## Findings that need action, by severity

| # | Severity | Finding | State |
|---|---|---|---|
| A | **Critical** | Members could mint City Card stamps directly, bypassing receipts entirely | Migration written, **needs applying** |
| B | **High** | Anyone, unauthenticated, could lock any café out of its own portal indefinitely | ✅ Fixed (Pass 2) |
| C | **High** | Anyone could forge partner-facing and reimbursement metrics | ✅ Fixed (Pass 2) |
| D | Medium | `/api/portal/redeem` had no rate limit — brute-forceable reward codes | ✅ Fixed (Pass 2) |
| E | Medium | Receipt upload cap was per-café, not per-member as §3.1f requires | ✅ Fixed (Pass 2) |
| F | Medium | Portal PIN compared non-constant-time; lockout ceiling was itself a DoS | ✅ Fixed (Pass 2) |
| G | Medium | Backups unverified — free-tier Supabase has none at all | **Open — needs you** |
| H | Low | `/api/analytics/track` entirely unthrottled | ✅ Fixed (Pass 2) |
| I | Low | Portal session HMAC reuses `SUPABASE_SERVICE_ROLE_KEY` | Accepted, documented |
| J | Low | No automated receipt-image purge | Accepted, operational |
| K | Low | ~15 routes return raw Postgres `error.message` to the client | ✅ Fixed (Phase 18) |
| L | Low | `importCafesCsv` upserts row-at-a-time | Open, not urgent |

---

## A. Critical — direct stamp minting via the `visits` insert policy

**What was wrong.** Migration `0001` shipped:

```sql
create policy "users can insert their own visits" on public.visits
  for insert with check (auth.uid() = user_id);
```

At that point `visits` was a plain visit log. Migration `0008` then added
`status` and `stamp_awarded` to the same table and made it the ledger the
City Card counts — but the insert policy was never narrowed. It constrains
*whose* row it is and nothing else: not `status`, not `stamp_awarded`, not
`receipt_image_path`.

**Impact.** Any signed-in member, from their own browser with nothing but
the public anon key, could insert:

```js
{ user_id: <self>, cafe_id: <any partner café>, status: 'approved', stamp_awarded: true }
```

Five of those across three cafés satisfy every rule `getStampCard()`
enforces (`lib/server/sixthRound.ts`) and mint a genuine reward — skipping
the receipt photo, the SHA-256 duplicate check, the daily caps, the
`partner_status` check, and café review entirely. Once Founding Partners
convert to paid (§3.0.5), each forged reward is a real reimbursement
invoice. This is the highest-value target in the product and it had no gate
at the database level.

Pass 1 recorded "RLS enabled and behaviorally verified on every table" —
true, and not sufficient. RLS being *on* was verified; what each policy
actually permitted was not read individually.

**Fix.** `supabase/migrations/0020_visits_insert_api_only.sql` drops the
policy — the same move `0005` made for `partner_applications`, for the same
reason. `POST /api/visits` uses the service-role client and performs every
check; grep confirms nothing inserts into `visits` with the anon key, so
this removes no working path. Dropping a policy is reversible; the exact
statement to restore it is in `0001`.

The same migration drops the unused `users can upload their own receipts`
storage policy — uploads go through the service-role client, so it only let
a signed-in member write unlimited files into a private bucket at our
expense. The matching *select* policy is kept; it matches what the privacy
policy describes.

> **Not applied.** Per the standing instruction, no migration was run
> against a live database. Apply `0018`, `0019` and `0020` together before
> real users touch the app.

## B. High — café portal lockout via forged analytics events

`POST /api/portal/login` rate-limits by counting `portal_login_failed` rows
in `analytics_events`. But `portal_login_failed` was in the same catalog
`POST /api/analytics/track` validated against — and that route is
unauthenticated by design (it has to be; `hero_quiz_completed` fires before
an account exists).

**Impact.** Ten unauthenticated POSTs of
`{ event: 'portal_login_failed', properties: { slug: 'phil-and-sebastian' } }`
locked that café out of its own portal for 15 minutes. In a loop, forever.
No account, no session. A denial-of-service against a paying partner that is
cheaper to run than the brute force it was defending against — and the
café's only symptom is "too many attempts," with no way to tell it isn't
their own staff fat-fingering the PIN.

**Fix.** `lib/analyticsEvents.ts` now exports `CLIENT_ANALYTICS_EVENTS` —
the 7 events browser code actually fires — alongside the full catalog. The
track route validates against that subset, and `track()` in
`lib/analytics.ts` is typed to it, so a client event that isn't allowlisted
is a compile error rather than a silent runtime drop.

## C. High — forgeable partner and reimbursement metrics

Same root cause as B, different payoff. The catalog includes
`reward_redeemed`, `receipt_approved`, `reimbursement_marked_paid`,
`cafe_created` and `reward_item_created` — the events behind the numbers
shown in the café portal and used to work out what BREW AND THE CITY owes a
café. All were writable from an unauthenticated request body.

**Fix.** Covered by the same allowlist split, and locked in by
`lib/__tests__/analyticsEvents.test.ts`, which asserts these specific names
can never re-enter the client list.

## D. Medium — `/api/portal/redeem` brute force *(Pass 1's top open item, now closed)*

Activation codes are 4 characters from a 33-character alphabet (~1.19M
combinations) with a 10-minute expiry. With no throttle on failed
redemptions, a café holding a valid portal session could guess at another
member's pending code inside that window and redeem real value at its own
counter. The bar is high — it needs an already-valid, manually-vetted café
session — but it is real money.

**Fix.** Capped at 20 *failed* attempts per café per 10 minutes via
`lib/server/rateLimit.ts`. Successful redemptions never consume budget, so a
busy café is never throttled. Throttled attempts are written to
`error_logs`, which makes the abuse visible rather than merely blocked.

## E. Medium — receipt upload cap didn't match the spec

§3.1f specifies "cap uploads at 3/day per member." The implemented check was
one receipt *per café* per day with no ceiling across cafés — with 60 seeded
cafés, 60 uploads a day was inside every limit.

**Fix.** `app/api/visits/route.ts` now fetches the day's visits once and
applies both rules: the existing per-café check plus a hard
`MAX_UPLOADS_PER_DAY = 3`. Same number of database round-trips as before.

## F. Medium — portal PIN comparison and lockout ceiling

- **Fixed:** the PIN was compared with `!==`, which short-circuits on the
  first differing byte and leaks prefix/length information through response
  timing. Now `timingSafeEqual`.
- **Fixed:** the per-slug ceiling was 10 failures per 15 minutes — meaning
  ten wrong guesses locked out the real café, so the lockout *was* the
  attack. Now two limits: 10 per IP (in-memory, cheap, stops one attacker
  hammering) and 25 per slug (database-backed, survives a cold start, is the
  real brute-force ceiling at ~100 guesses/hour).
- **Accepted risk:** `cafes.portal_pin` is plaintext. It is readable only
  with the service-role key, and it is a deliberately low-tier credential
  (§21 — "a web page and a PIN"). Hashing it would stop an admin reading a
  PIN back to a café over the phone, which is the actual onboarding process
  today (`PILOT_READINESS.md` §5). Revisit if the portal ever gains
  money-moving powers beyond redemption.
- **Recommendation, not a code change:** generated credentials are 6
  characters from a 32-character alphabet (~10⁹ combinations). The admin café
  form invites a 4-digit PIN by example (`placeholder="e.g. 4271"` — 10,000
  combinations, ~50 hours to exhaust at the new ceiling). **Use the
  generated credential; don't hand-type short PINs.**

## G. Medium — backups unverified *(open, needs you)*

Cannot be checked from code. Supabase's free tier has **no automated backups
at all**; paid tiers add daily backups, and PITR is higher still. If the
production project is on free tier there is currently no backup of
production data. A backup nobody has restored from is a hypothesis, not a
backup — do a test restore once.

## H. Low — analytics endpoint unthrottled

No limit at all; one client could inflate `analytics_events` (which is also
what the portal rate limiter reads). Now 60/minute per IP. A throttled call
returns `202` with a success-shaped body — analytics must never look like a
failure to the caller, which doesn't read the response anyway.

## I. Low — portal session secret reuse

`lib/portalSession.ts` signs portal cookies with an HMAC keyed on
`SUPABASE_SERVICE_ROLE_KEY`, already documented in that file as a
convenience over adding an env var. Two consequences: rotating the
service-role key silently signs every café out (acceptable — 12-hour
sessions), and one secret compromise costs both database access and portal
impersonation. A dedicated `PORTAL_SESSION_SECRET` is the clean fix; left
alone here because introducing a newly-required env var immediately before
launch is its own outage risk. **First post-launch maintenance window.**

## J. Low — receipt purge is manual

The privacy policy promises receipt photos are "deleted automatically 30
days after the redemption is resolved." `purgeOldReceipts()` in
`app/admin/actions.ts` does exactly that, correctly — but it's a button, and
there is no scheduled-job runner in this environment. This is a real gap
between a published promise and observed behaviour, and it is operational:
put a monthly reminder on whoever runs the admin console, or wire it to
Vercel Cron / Supabase `pg_cron` post-launch.

## K. Low — raw Postgres errors returned to clients *(fixed, Phase 18)*

Established in Phase 3, deferred through Phase 15 and 17 as "worth a
dedicated pass rather than a rushed multi-file sweep" — Phase 18 was that
pass. 17 call sites across 15 route files (every one confirmed individually
to already call `logServerError` with the real error immediately before
also leaking it to the client) now return the same generic
`'Something went wrong. Please try again.'` on an unexpected 500, matching
the convention already established in `portal/login`. `rewards/activate`'s
`err.message` on a 400 was checked and left alone — that one is a
hand-written `ActivationError` message, not raw Postgres text.

## L. Low — `importCafesCsv` upserts row-at-a-time

`app/admin/actions.ts` loops sequentially rather than issuing one batched
`.upsert([...])`. At pilot scale (~60 cafés) this is a few seconds. Worth
batching if the catalogue grows. Everywhere else that awaits per item
already uses `Promise.all`, over naturally small lists.

---

## Verified — no change needed

Reviewed and found correct. Recorded so the next pass doesn't re-derive it.

### Authentication

| Area | Finding |
|---|---|
| Sessions | `SessionProvider` is the single source of truth (dedupes concurrent fetches), backed by `supabase.auth.onAuthStateChange`. Refresh happens in `proxy.ts` on every request. Audited in full in Phase 4. |
| Permissions | Admin routes gated centrally through `requireAdmin()` in `app/admin/layout.tsx`; verified every exported action in `app/admin/actions.ts` calls it as its first line. `ADMIN_EMAILS` is not `NEXT_PUBLIC_`, so the allowlist never reaches the browser. |
| Password flows | Full signup/login/forgot/reset/change. Supabase handles all password storage — no password field exists anywhere in `public.users`. `friendlyAuthError` never distinguishes "wrong email" from "wrong password" (anti-enumeration). `ChangePasswordForm` re-verifies the current password via a fresh `signInWithPassword` first. Audited in Phase 4, 18 tests. |
| Admin access | Email allowlist, no role table — correct for pilot scale. Non-admins bounce to `/` rather than a "not authorized" page, which avoids confirming the console exists. |
| Route protection | Per-page (`if (!user) redirect(...)` + `assertOnboarded`), not middleware-based. This is the safer arrangement: a missed middleware matcher fails open, a missing per-page check fails at the page that needs it. |
| Open redirects | `lib/safeRedirect.ts` rejects `//evil.com`, `https://evil.com`, `/\evil.com`. Unit-tested. |
| Portal sessions | `timingSafeEqual` on the HMAC, expiry checked, token bound to a specific `cafeId`. Cookies `httpOnly`, `sameSite: 'lax'`, `secure` in production, 12h TTL. |

### Authorization — all 23 API routes read

- Every `/api/portal/*` write calls `hasPortalSession(cafeId)` before acting.
  `visits/[visitId]` resolves the visit first, then checks the session
  against **that visit's** café — a valid session for café A cannot approve
  café B's queue.
- `/api/portal/redeem` deliberately allows any logged-in portal to redeem
  (that's the cross-network point of the City Card) but scopes the lookup to
  `pending_cafe_id = cafeId`, so a code activated for A can't be redeemed at
  B. The update is guarded with `.eq('status', 'active')`, closing the
  double-redemption race.
- `/api/admin/*` calls `requireAdmin()` first.
- Every member route derives `user.id` from `supabase.auth.getUser()`, never
  from the request body.
- Feature flags are checked server-side on receipt upload, activation,
  redemption and café review — not merely hidden in the UI.

### Database

| Area | Finding |
|---|---|
| Indexes | `0018_performance_indexes.sql` covers every column a real query filters on with no other narrowing predicate. **Still not applied.** |
| Migrations | All 20 accounted for; 17 applied, 3 pending. No schema drift — live schema matches `lib/supabase/types.ts` column-for-column, verified against the live PostgREST schema. |
| RLS | Enabled on all 17 tables, verified behaviourally *and* (in Pass 2) policy by policy. Finding A was the only policy granting more than intended. `rewards`, `analytics_events`, `audit_log`, `feature_flags`, `merchant_strings`, `reimbursement_payments`, `error_logs` have no public write policy at all. |
| Service-role scoping | `sixthRound.ts` uses the service-role client but scopes every query with an explicit `.eq('user_id', userId)`, so bypassing RLS doesn't widen what it reads. |
| Business rules | Confirmed enforced server-side, not just in the UI: max 2 stamps per café per card (FIFO), 90-day stamp expiry, 5 stamps per reward, per-café monthly redemption cap, per-item monthly cap, 10-minute activation TTL, unique index on `receipt_hash`. |

### Application

| Area | Finding |
|---|---|
| File uploads | Receipt uploads have type allowlist, size cap matching the bucket's own limit, hash dedup, per-café/per-day dedup, and storage cleanup on DB-insert failure. Café-photo uploads (admin-only) gained matching application-level validation in Pass 1 — the bucket already enforced its own limits, but a rejected file surfaced Supabase's raw storage error. |
| User data protection | Analytics checked for PII in Phase 12 — one instance found and removed (`account_created` no longer duplicates the user's email into `properties`). Service-role key confirmed server-only: 2 files, neither a Client Component. |
| Secrets | No hardcoded keys anywhere. `.env*` gitignored with an explicit `!.env.local.example` exception. |

### Infrastructure

| Area | Finding |
|---|---|
| Deployment | No committed deployment config beyond `.github/workflows/ci.yml` (lint/typecheck/test, no deploy step). Normal for zero-config Vercel, but there's no repository record of where this deploys — document it once a target is chosen. |
| Monitoring | No external APM or error tracking. Everything homegrown: `error_logs` and `analytics_events`, written via `logServerError`/`trackServerEvent`. Queryable, but **no alerting** — nobody is notified if errors spike; someone has to think to look. |
| Logging | Consistent and structured (`scope`, `message`, `detail`, `user_id`) on essentially every failure path. A genuine strength of this codebase, not a gap. |

---

## What actually needs attention before launch

1. **Apply `0018`, `0019` and `0020`.** `0020` closes finding A, which is
   live until it runs. `0019` blocks partner onboarding. `0018` is the
   indexes. Not applied here, per the standing instruction.
2. **Verify the Supabase backup plan and do one test restore** (finding G).
3. **Decide on alerting.** `error_logs` is a table nobody watches; a silent
   failure in receipt upload or redemption would be reported by a café
   before it was noticed here.
4. **Schedule the receipt purge** (finding J) — a published privacy promise
   currently kept by hand.
5. **In-memory rate limits are per-instance** and reset on cold start. The
   database-backed checks behind them are the real ceilings; if this scales
   past one or two instances, move the limiter to a shared store.
6. **Admin access is an email allowlist with no 2FA requirement** beyond
   whatever the admin's own email account has. Fine at this size; revisit
   before the console can move money.

## Next recommended step

Phase 16 — assemble `LAUNCH_CHECKLIST.md`, with "apply `0018`/`0019`/`0020`"
and "verify a database restore" as hard gates rather than checklist items.
