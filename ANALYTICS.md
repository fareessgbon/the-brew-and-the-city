# Analytics

Homegrown, not a third-party tool — every event lands in the `analytics_events`
Postgres table (`id, event, user_id, properties, created_at`). There is no
PostHog/Mixpanel/etc. integration despite `.env.local.example` once
referencing PostHog build steps; that env var was removed as dead config in
an earlier pass (see `PRODUCTION_CHECKLIST.md`).

## How it works

- **Client Components** call `track(event, properties?)` from `lib/analytics.ts`
  — fire-and-forget (`fetch('/api/analytics/track', ...)`, errors swallowed,
  never `await`ed by the caller), because an analytics call must never be
  able to break the UI flow it's attached to.
- **Server Components / Route Handlers / Server Actions** call
  `trackServerEvent(event, userId, properties?)` from `lib/server/trackEvent.ts`
  directly — skips the self-fetch round trip since it's already running
  server-side, but is the same fire-and-forget contract (catches its own
  errors, logs via `logServerError`, never throws).
- **`POST /api/analytics/track`** is the only client-reachable write path.
  It validates the event name against the closed catalog in
  `lib/analyticsEvents.ts` (an unrecognized name is rejected, not silently
  recorded — typos can't drift into real data), caps the `properties`
  payload at 4KB, and attaches `user_id` **from the authenticated session
  server-side** — never trusted from the client request body, so a caller
  can't spoof which user an event is attributed to.
- `analytics_events` has RLS enabled with **no public policies at all** —
  every write goes through the service-role client (either inside the
  validated route above, or directly from server code that already
  authenticated the request). The anon key cannot insert directly.

## Event catalog

### User lifecycle
| Event | Fires when | Key properties |
|---|---|---|
| `signup_requested` | Signup form submitted (before email confirmation) | `source` (`homepage_signup` \| `signup_page`) |
| `account_created` | First sign-in after clicking the email confirmation link (detected by `created_at` within 15s of the callback firing — Supabase doesn't hand back an explicit "this was a signup" flag) | — (just `user_id`; see "Privacy" below for why no email) |
| `login_submitted` | Password login submitted | `source` |
| `password_reset_requested` | Forgot-password form submitted | — |
| `hero_quiz_completed` | Homepage teaser quiz (pre-signup) finished | — |
| `full_quiz_completed` | The real 9-question onboarding quiz saved | `answeredDims`, `radiusKm`, `worthTrip`, `primaryDrinkCategory` |
| `location_saved` | Home location step saved (onboarding *or* later from account settings — `via: 'preferences'` distinguishes the latter) | `method` (`gps` \| `neighbourhood` \| `skipped`) |
| `onboarding_completed` | **New this phase.** The real `false → true` transition of `taste_profiles.onboarding_completed` — fires once per account, not on a later re-visit to the location step | `locationMethod` |

### Discovery & engagement
| Event | Fires when | Key properties |
|---|---|---|
| `context_selected` | A "what do you need" filter chosen on `/today` | `context` |
| `match_viewed` | `/today` feed loads with results | `context`, `count`, `topCafeId` |
| `cafe_profile_opened` | A café's own page is opened | `cafeId`, `slug` |
| `cafe_saved` | Café bookmarked | `cafeId` |
| `directions_clicked` | "Get directions" link clicked | `cafeId` |
| `not_it_submitted` / `not_it_undone` | "Not it" feedback given / retracted | `cafeId` |

### City Card
| Event | Fires when | Key properties |
|---|---|---|
| `receipt_submitted` | Receipt photo uploaded | `cafeId` |
| `receipt_approved` / `receipt_rejected` | A pending visit is reviewed — **from any of the three paths that can do this**: the café portal, admin backup review, and admin force-add-stamp (force-add always counts as `receipt_approved`, since it's the same end state) | `visitId`, `cafeId`, `reviewedBy` (`cafe` \| `admin` \| `admin_force`) |
| `reward_earned` | 5th stamp lands, City Card reward created | `rewardId` |
| `reward_activated` | Reward activated at a specific café (starts the 10-minute redemption window) | `cafeId`, `itemId` |
| `reward_redeemed` | Café redeems a member's code | `rewardId`, `cafeId` |

### Café portal
| Event | Fires when | Key properties |
|---|---|---|
| `portal_login_succeeded` / `portal_login_failed` | Café PIN entry | `slug`, `cafeId` (on success) |
| `reward_item_created` | **New this phase.** A café's eligible-item list gets a new entry — fires from **both** write paths (café self-service via the portal, and admin adding one directly) | `cafeId`, `rewardItemId`, `source` (`cafe_portal` \| `admin`) |

### Admin / partner operations
| Event | Fires when | Key properties |
|---|---|---|
| `partner_application_submitted` | Public partner-application form submitted | `cafeName`, `neighbourhood` |
| `cafe_created` | **New this phase.** A café row is created — fires from **both** paths: an admin creating one directly, and approving a partner application | `cafeId`, `source` (`admin_manual` \| `partner_application`) |
| `reimbursement_marked_paid` | **New this phase.** Admin marks a redeemed reward as reimbursed | `rewardId` |

### Requested-but-not-added (documented, not silently dropped)
- **`email_verified`** — not added as a separate event. For this app's
  signup flow, email confirmation and first sign-in are the same moment
  (Supabase's `exchangeCodeForSession` in `/auth/callback` *is* clicking the
  confirmation link), which is exactly what `account_created` already
  captures. A second, identically-timed event would be redundant, not
  valuable.
- **Café-side `profile_viewed` / `matched` / `saved` / `redemption_received`**
  — not separate events; they're the same underlying events already listed
  above from the member's side (`cafe_profile_opened`, `match_viewed`,
  `cafe_saved`, `reward_redeemed` respectively), which already carry
  `cafeId`. A café's own aggregated view of these (shown in the portal's
  weekly stats card) is computed from `visits`/`rewards` directly, not from
  `analytics_events` — no gap to fill.

## Privacy & security review (this phase)

- **Removed the one instance of unnecessary PII**: `account_created` used
  to log `{ email: user.email }` in `properties`, duplicating data already
  reachable via `user_id`. Removed — `user_id` alone is sufficient for any
  legitimate lookup.
- Checked every `track()`/`trackServerEvent()` call site in the codebase:
  no other event logs an email, name, address, or any other field that
  identifies a specific person beyond the `user_id` column itself.
  Everything else is IDs (`cafeId`, `visitId`, `rewardId`), enums
  (`context`, `method`, `source`), and counts.
- No secrets ever appear in `properties` — confirmed by inspecting every
  call site directly, not by pattern-matching after the fact.
- **RLS confirmed, not assumed**: verified directly against the live
  Supabase project (not just by reading the migration SQL) that
  `analytics_events` has zero rows readable via the anon key even though
  real rows exist via the service-role key — see `PRODUCTION_CHECKLIST.md`.
- **Works in production**: the live project already has ~180 real
  `analytics_events` rows from this engagement's own testing, confirming
  the write path functions end-to-end against the real database, not just
  locally.
