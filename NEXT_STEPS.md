# Next steps — Brew and the City

Status snapshot taken from a direct read of the repo, not from the phase plan's
assumptions. Current tree: `npm run lint` clean, `npx tsc --noEmit` clean.
(`npx vitest run` could not execute in this environment — a missing
`@rolldown/binding-wasm32-wasi` native binding, an environment issue rather than
a code failure. CI on GitHub Actions is the source of truth for the test run.)

---

## Where the project actually is

| Phase | Deliverable | State |
|---|---|---|
| 1 — DB + production foundation | `PRODUCTION_CHECKLIST.md` | ✅ Done |
| 2 — Partner onboarding pipeline | `lib/admin/partnerOnboarding.ts`, migration `0019` | ✅ Done (migration not yet applied) |
| 3 — Public-facing production issues | Map fallback, loading/error states | ✅ Done |
| 4 — Password authentication | login / signup / forgot / reset | ✅ Done |
| 5 — Preference quiz | `lib/data/full-quiz.ts`, `FullQuiz.tsx` | ✅ Done |
| 6 — Matching + discovery | `lib/matching/*` | ✅ Done |
| 7 — Consumer experience | Today / Discover / Map / Saved / Profiles | ✅ Done |
| 8 — City Card | receipts, stamps, rewards, reimbursements | ✅ Done |
| 9 — Café Portal | `app/portal/[slug]`, `components/portal/*` | ✅ Done |
| 10 — Final production audit | folded into Phases 1 + 11 | ✅ Done |
| 11 — Pilot launch prep | `PILOT_READINESS.md` | ✅ Done |
| 12 — Analytics + observability | `ANALYTICS.md` | ✅ Done |
| 13 — Marketing + SEO | `app/sitemap.ts`, `app/robots.ts`, metadata | ⚠️ Mostly done — see gaps |
| 14 — Real user testing prep | `BETA_TESTING_CHECKLIST.md` | ⚠️ Written; on-device testing not run |
| **15 — Security + scaling review** | `SECURITY_REVIEW.md` | ❌ **Not started** |
| **16 — Launch checklist** | `LAUNCH_CHECKLIST.md` | ❌ **Not started** |

---

## 0. Do this first — housekeeping (blocking, ~15 min)

- [ ] **Commit the working tree.** 18 modified files and 12 untracked files
      (including all of Phases 11–14: `PILOT_READINESS.md`, `ANALYTICS.md`,
      `BETA_TESTING_CHECKLIST.md`, `.github/`, migrations `0018`/`0019`,
      `lib/admin/partnerOnboarding.ts`, `app/sitemap.ts`, `app/robots.ts`,
      new tests) are uncommitted. **This is the single largest risk in the
      repo right now** — several phases of work exist only on one disk.
- [ ] Confirm CI is green on `main` after that push.

---

## 1. Phase 15 — Security and scaling review → `SECURITY_REVIEW.md`

### Known gap found during this review

- [ ] **No rate limiting anywhere.** Zero references to any rate-limiting
      mechanism across all 23 API routes. The routes that matter most:
      - `POST /api/portal/login` — 4-character PIN, brute-forceable in minutes
        with no lockout. **Highest-severity item found.**
      - `POST /api/visits` (receipt upload) — spec §3.1f calls for a hard cap
        of 3 uploads/day/member; verify whether that's enforced in application
        logic, and add it if not.
      - `POST /api/partner-applications` — public, unauthenticated, spammable.
      - `POST /api/analytics/track` — authenticated and payload-capped, but
        unthrottled.

### Review areas to work through

- [ ] **Authentication** — session handling, `middleware.ts` route protection,
      password flows, `ADMIN_EMAILS` allowlist enforcement, portal session
      cookie scope and expiry.
- [ ] **Database** — RLS policy audit per table (behaviour already spot-checked
      in Phase 1; do a full per-policy pass), index coverage after `0018` lands,
      Supabase automated backups (confirm the plan tier actually includes PITR).
- [ ] **Application** — API authorization per route (especially every
      `/api/portal/*` and `/api/admin/*`), file-upload validation
      (MIME + magic bytes, not just extension), error messages that don't leak
      internals, the 30-day receipt-image deletion promised in the privacy
      policy (spec §3.1f — **confirm something actually deletes them**).
- [ ] **Infrastructure** — deployment target decided, monitoring, and where
      `error_logs` rows actually get looked at (there's a table, but no alerting).

---

## 2. Phase 16 — Launch checklist → `LAUNCH_CHECKLIST.md`

Consolidates the technical / product / business gates. Mostly assembly work
once Phase 15 is done.

---

## 3. Carried-over blockers (from `PILOT_READINESS.md` + `PRODUCTION_CHECKLIST.md`)

These are operational, need you (or a decision), and several block launch:

- [ ] **Apply migrations `0018` and `0019` to production.** Partner-application
      approval will throw a Postgres "column does not exist" error on first use
      without `0019`. Needs the Postgres connection string, not the API keys.
- [ ] **Configure custom SMTP in Supabase.** The built-in mailer is rate-limited
      to a handful of emails/hour and is dev-only — a pilot will hit that wall
      immediately at signup.
- [ ] **Add the production domain to Supabase Auth → Redirect URLs.**
- [ ] **Set `NEXT_PUBLIC_SITE_URL`** to the real domain, or every shared link
      preview and the whole sitemap point at `localhost:3000`.
- [ ] **Decide on `NEXT_PUBLIC_MAPBOX_TOKEN`** — get a public (`pk.`) token, or
      launch with the café-list fallback.
- [ ] **Rotate `SUPABASE_SERVICE_ROLE_KEY`** if the current dev project becomes
      production (it's been sitting in a local `.env.local`).
- [ ] **Set production `ADMIN_EMAILS`.**
- [ ] **Decide how pilot cafés receive their portal PIN** — no automated
      delivery exists; today an admin hands it over manually.
- [ ] **Get Terms of Service §7 reviewed** once real cafés are verified partners.
- [ ] **Remember per café:** after approving, set partner tier above `'listed'`
      or its City Card features stay invisible. (The admin UI now reminds you.)

---

## 4. Smaller gaps worth closing before launch

- [ ] **No Open Graph image.** No `opengraph-image` / `twitter-image` file
      exists, so every shared café link and the homepage render as a bare text
      card. High leverage for a discovery product that expects to be shared —
      cheap to fix with Next's file-based `opengraph-image.tsx`.
- [ ] **Session-expiry UX** (documented in `BETA_TESTING_CHECKLIST.md`, not
      fixed): an expired session shows a plain "Not signed in." with no redirect
      to `/login`.
- [ ] **`README.md` is still the stock `create-next-app` boilerplate.** First
      thing any collaborator or contractor reads.
- [ ] **Repo/package still named `matcha-matchup-web`** while the product is
      Brew and the City. Cosmetic, but decide now rather than after links exist.
- [ ] **On-device testing has never been run.** The Phase 14 matrix
      (iPhone Safari / Android Chrome / Desktop Chrome, slow 3G, failed uploads,
      empty states) needs a human on real hardware against a deployed URL.
      Two real iOS bugs were already found by code review alone — assume more
      exist that only hardware will surface.

---

## Recommended order

1. Commit and push everything (§0).
2. Deploy to a staging URL — nothing in §4 or Phase 14 can be verified without one.
3. Phase 15 security review, starting with portal-login rate limiting.
4. Apply migrations, then work the §3 operational list.
5. Phase 16 launch checklist.
6. On-device testing pass against staging.

Explicitly **not** now, per the spec's own v1 cut line (§0.5): friends/social
feed, matching layer 2, City Picks / Elo, awards, Stripe billing, native apps.
