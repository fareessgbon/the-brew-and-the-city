# Launch checklist

The final synthesis of Phases 1–15. Each item links back to the document
that has the actual detail — this file is the "are we ready" summary, not
a replacement for `PRODUCTION_CHECKLIST.md`, `PILOT_READINESS.md`,
`ANALYTICS.md`, `BETA_TESTING_CHECKLIST.md`, or `SECURITY_REVIEW.md`.

## Technical

- [ ] **Deployment complete** — no committed deployment config exists
      (expected for a zero-config Vercel-style Next.js deploy); confirm
      where this is actually hosted and that `NEXT_PUBLIC_SITE_URL` is set
      to the real domain (`PRODUCTION_CHECKLIST.md` §1, `SECURITY_REVIEW.md`
      "Infrastructure").
- [ ] **Migrations complete** — ⚠️ **not yet true.** `0018` (performance
      indexes) and `0019` (partner-onboarding schema) are written but not
      applied to the live database. `0019` in particular means a real,
      already-shipped feature (approving a partner application) will error
      in production until this runs. See `PRODUCTION_CHECKLIST.md` §1 for
      the exact command.
- [ ] **Backups enabled** — ⚠️ **unverified, not visible from code.**
      Depends on the live Supabase project's pricing tier — free tier has
      none at all. Check the Supabase dashboard directly before launch
      (`SECURITY_REVIEW.md` "Database").
- [ ] **Monitoring enabled** — homegrown only (`error_logs` +
      `analytics_events` tables, no external APM/alerting). Functional but
      passive — nobody gets notified of a spike, someone has to check.
      Acceptable for pilot scale; revisit if usage grows
      (`SECURITY_REVIEW.md` "Infrastructure").
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is rotated if the current dev-time
      project becomes the production one (`PILOT_READINESS.md` §1).
- [ ] Confirm custom SMTP is configured in Supabase Auth — the default
      email service is rate-limited to a handful of emails/hour and isn't
      meant for real signups (`PILOT_READINESS.md` §1).
- [ ] Confirm the production domain is in Supabase's Auth redirect-URL
      allowlist (`PILOT_READINESS.md` §1).
- [ ] Decide on `NEXT_PUBLIC_MAPBOX_TOKEN` — get a real one, or launch
      without `/map`'s interactive view (the café-list fallback works
      either way and no longer shows developer-facing error text —
      Phase 3).
- [ ] CI (`.github/workflows/ci.yml`) green on `main` — lint, typecheck,
      and all 128 tests.

## Product

- [ ] **Onboarding tested** — signup → email confirmation → 9-question quiz
      → location → recommendations, traced file-by-file end to end
      (`PILOT_READINESS.md` §3). Real device/browser verification is
      still outstanding — see `BETA_TESTING_CHECKLIST.md`'s device matrix.
- [ ] **Café portal tested** — login (including the "no PIN set yet"
      fallback), reward-item management, receipt review, all traced end to
      end (`PILOT_READINESS.md` §4). iOS Safari auto-zoom and a `100vh`
      viewport bug on the portal login screen were found and fixed
      (Phase 14) — both were real, live bugs on the café's actual daily
      entry point.
- [ ] **Rewards tested** — City Card stamp counting, 5-visit reward
      unlock, activation (10-minute window), redemption, all traced and
      confirmed connected. `/api/portal/redeem` has no rate limit on
      failed attempts — real but bounded risk, documented with a specific
      fix in `SECURITY_REVIEW.md`, not yet implemented.
- [ ] **Reimbursements tested** — admin grouping/totals/mark-paid flow
      confirmed working; now analytics-tracked too (`ANALYTICS.md`).
- [ ] **Partner application → café pipeline tested** — this was the
      single biggest operational gap identified across the whole review
      (Phase 2) and is now fully built: approval creates the café,
      generates a portal credential, links the application, prevents
      duplicate approval, handles slug collisions, and reminds the admin
      if the café's tier is still `'listed'` (meaning City Card features
      won't show yet) — see `PILOT_READINESS.md` §4.
- [ ] Demo/placeholder disclaimers (`DemoBanner`, homepage copy) are now
      **data-driven** — they stop showing automatically once every listed
      café is verified, rather than needing a manual removal step someone
      could forget (Phase 11). Terms of Service §7 still has the old
      static language and needs a **human/legal review**, not a code fix
      (Phase 11 — deliberately not touched).
- [ ] The homepage's "How it works" section no longer describes a
      "friends"/social-proof ranking factor that was never built — was
      live, false marketing copy until Phase 13.

## Business

- [ ] **First cafés ready** — the onboarding pipeline (above) is built and
      tested; remember the tier-promotion step is still manual by design
      (a deliberate safety default, not an oversight — see
      `PILOT_READINESS.md` §4).
- [ ] **Support process ready** — not something I can build or verify;
      no in-app support/contact flow was reviewed as part of this
      engineering-focused effort. Worth a deliberate decision on how a
      confused pilot user or café reaches a human.
- [ ] **Marketing assets ready** — `BETA_TESTING_CHECKLIST.md`'s device
      matrix and `SECURITY_REVIEW.md`'s open items should be closed (or
      consciously accepted) before any real marketing push, since that's
      what determines actual first-impression traffic volume.
- [ ] Portal PIN delivery to a new café is entirely manual today (no
      email/SMS automation) — a reasonable, deliberate scope boundary for
      a handful of pilot cafés (`PILOT_READINESS.md` §5), worth
      reconsidering only if the café count grows past what's manageable
      by hand.

## What's genuinely blocking vs. what's a conscious, documented tradeoff

**Blocking** (should happen before real users/cafés touch this):
1. Apply `0018` + `0019`.
2. Verify Supabase backup plan.
3. Verify custom SMTP + redirect-URL allowlist.

**Conscious tradeoffs, not oversights** — each was a deliberate decision
during this review, documented with reasoning in place rather than silently
skipped: manual tier promotion after café approval, manual portal PIN
delivery, no external monitoring/APM, `/api/portal/redeem` rate limiting
deferred, the raw-error-message pattern across ~15 API routes deferred,
Terms of Service left untouched pending legal review.

## Document map

| Document | Covers |
|---|---|
| `PRODUCTION_CHECKLIST.md` | Database, environment variables, secrets |
| `PILOT_READINESS.md` | First-café and first-user flow tracing |
| `ANALYTICS.md` | Full event catalog, privacy review |
| `BETA_TESTING_CHECKLIST.md` | Device/browser matrix, failure scenarios |
| `SECURITY_REVIEW.md` | Auth, database, application, infrastructure |
| `LAUNCH_CHECKLIST.md` | This file — the final synthesis |
