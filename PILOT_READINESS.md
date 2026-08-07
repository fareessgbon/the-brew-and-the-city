# Pilot readiness checklist

Phase 11 output — covers what's needed to onboard the first real cafés and
users, on top of `PRODUCTION_CHECKLIST.md` (database/environment). Findings
below are from directly reading the code paths involved, not assumptions.

## 1. Production environment

| Item | Status |
|---|---|
| Supabase connection | ✅ Live project verified directly (see `PRODUCTION_CHECKLIST.md`) |
| Environment variables | ✅ Documented in `PRODUCTION_CHECKLIST.md` |
| Storage buckets | ✅ Both exist, correctly configured (`PRODUCTION_CHECKLIST.md`) |
| Mapbox | ⚠️ Not configured — degrades to a working café list, not blocking |
| Domain configuration | ✅ No hardcoded localhost/domain anywhere; every auth redirect URL is computed from `window.location.origin`, so it automatically follows wherever the app is deployed |
| Email configuration | ⚠️ **Needs manual verification — not visible from code.** Two specific things to check in the Supabase dashboard before real users sign up: <br>1. **Custom SMTP provider configured.** Supabase's default/built-in email service is rate-limited to a handful of emails per hour and is explicitly meant for development, not real signups — a pilot with more than a few users will hit this fast. <br>2. **Redirect URL allowlist includes the real production domain.** The app already computes correct URLs dynamically, but Supabase will reject them at send-time if the domain isn't in Auth → URL Configuration → Redirect URLs. |

## 2. Development assumptions found and resolved

- **`DemoBanner` and part of `HomeContent`'s copy were static "this is a demo, not verified" disclaimers, regardless of the real data underneath.** This is a legal/trust safeguard (real café names, unverified taste data implies no partnership), not something to delete — but it's now **data-driven**: `app/page.tsx` computes whether every café currently listed has actually been verified (`cafes.verified_at`), and both the banner and the "sample data for this demo" copy stop rendering automatically once that's true. Nobody has to remember to manually remove them later, and it can never under-disclose (defaults to showing the warning).
- **`app/terms/page.tsx` §7 has the same disclaimer in Terms-of-Service prose form — deliberately left untouched.** Amending a legal document isn't a technical decision. **Action needed: get this reviewed (ideally by whoever owns the business/legal side) once real cafés are verified partners, alongside/after the banner naturally stops showing.**
- No other stale dev markers found (`TODO`/`FIXME`/"coming soon"/"under construction" — clean sweep, zero hits outside this).

## 3. First-time user flow — traced end to end

Signup → email confirmation → onboarding quiz (9 questions) → location step
(sets `onboarding_completed`) → today feed → café profile → save café →
upload receipt → café/admin approves → stamp counted → 5th stamp unlocks
reward → activate at a café → redeem. Every handoff was read directly, not
assumed connected. No broken links found — every step already has proper
loading/error/success states (confirmed in Phase 3).

## 4. Café partner flow — traced end to end, one real gap found and fixed

Admin approves application → café created (Phase 2) → portal PIN
auto-generated → café logs in at `/portal/[slug]` → manages reward items →
reviews receipts → customer redeems → admin marks reimbursement paid. All
individually solid (portal login even already handles "no PIN set yet"
gracefully, which now rarely triggers since Phase 2 always generates one).

**Gap found and fixed**: a freshly-approved application creates its café at
`partner_status: 'listed'` — deliberately, so no City Card money-relevant
feature goes live without an explicit admin review (per Phase 2's original
"never auto-assign a premium tier" instruction). But `cafe.partner_status
!== 'listed'` is also the exact gate that controls whether reward items and
receipt upload even *appear* on the café's public page — so a newly
onboarded café was invisible as a City Card participant with no indication
why. `app/admin/applications/page.tsx` now shows a clear reminder next to
an approved application until the linked café's tier is actually moved off
`'listed'`.

**This remains a required manual step for every pilot café**: after
approving an application (or creating a café directly), an admin must set
its partner tier to at least `partner` on the café's edit page before its
City Card features go live. The tier default was kept conservative
deliberately — this is documented here rather than changed, since loosening
it is a product decision, not a bug fix.

## 5. Pre-launch action items (not code — operational)

- [ ] Apply `supabase/migrations/0018` and `0019` (see `PRODUCTION_CHECKLIST.md` §1) — blocks the partner-onboarding feature otherwise.
- [ ] Confirm custom SMTP is configured in Supabase (see §1 above).
- [ ] Confirm the production domain is in Supabase's Auth redirect-URL allowlist.
- [ ] Decide on `NEXT_PUBLIC_MAPBOX_TOKEN` (get one, or launch without `/map`'s interactive view — the list fallback works either way).
- [ ] For each pilot café: after admin creates/approves it, remember to set its partner tier above `'listed'` — the applications page now reminds you if you forget.
- [ ] Get Terms of Service §7 reviewed once real café partners are verified (see §2 above).
- [ ] Decide how a pilot café actually receives its portal PIN — there is no automated delivery (email/SMS) today; an admin communicates it manually (phone, email, in person). Intentionally out of scope to automate right now (would mean adding a transactional-email integration, which doesn't exist in this codebase) — fine for a handful of pilot cafés, worth revisiting if the café count grows.
