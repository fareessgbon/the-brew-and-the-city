# Beta testing checklist

Phase 14 output. **Methodology note**: this phase's code-level review found
and fixed two real cross-device bugs (below), but I don't have physical
iPhone/Android devices or a deployed URL to test against directly — the
device/browser rows in this checklist genuinely need a human running real
hardware. Don't read "reviewed" as "verified on-device."

## Already found and fixed (code-level review)

- **iOS Safari auto-zoom on every form.** `.inline-form` (login, signup,
  forgot-password, reset-password) and `.cafe-signup-form` (admin café
  forms, the public partner-application form, café portal dashboard) both
  had `font-size: 15px` on inputs — one pixel under the 16px threshold
  Safari uses to decide whether to auto-zoom the whole page when a field is
  focused. On a real iPhone this meant tapping into the *email field on the
  signup form* — the very first interaction a mobile visitor has with the
  product — zoomed the page in, and it doesn't reliably zoom back out.
  Fixed: both bumped to 16px.
- **`100vh` on the café portal login screen** (`app/portal/[slug]/page.tsx`)
  — iOS Safari's address bar makes `100vh` taller than the actually-visible
  viewport, pushing the centered PIN entry screen partly out of view until
  the user scrolls. Fixed: switched to `100dvh`.
- Checked every other small-font-size CSS rule in `globals.css` for the
  same zoom issue — everything else is non-interactive text (list items,
  quiz option buttons, legal copy), not inputs. Checked every inline
  `fontSize` on an `<input>` across components — the one other small one
  (`ReceiptUploadForm`'s file input) doesn't trigger the bug, since
  `type="file"` renders a native picker with no text cursor.

## Device / browser matrix — needs a human on real hardware

| | iPhone Safari | Android Chrome | Desktop Chrome |
|---|---|---|---|
| Signup → email confirm → onboarding | ☐ | ☐ | ☐ |
| Today feed / café cards render correctly | ☐ | ☐ | ☐ |
| `/map` (with and without a Mapbox token) | ☐ | ☐ | ☐ |
| Receipt photo upload (camera roll *and* live camera capture) | ☐ | ☐ | ☐ |
| Reward QR code — legible, scannable at a counter | ☐ | ☐ | ☐ |
| Café portal PIN entry, numeric keypad shows correctly (`inputMode="numeric"`) | ☐ | ☐ | ☐ |
| Bottom mobile nav doesn't overlap content on small screens | ☐ | ☐ | ☐ |
| Admin console (desktop-oriented, but confirm it's at least usable) | — | — | ☐ |

## Specific scenarios to try deliberately

- [ ] **Slow internet** — throttle to "Slow 3G" in DevTools (or a real weak
      signal) and go through signup + quiz + receipt upload. Nothing in the
      code sets an artificial client-side timeout on these, so the
      expectation is "slow, not broken" — confirm that's actually true, and
      that every button shows a busy/disabled state the whole time (already
      reviewed and confirmed present in Phase 3 — `Sending…`, `Saving…`,
      `Uploading…` etc. — but confirm it *feels* right at real latency).
- [ ] **Empty states** — a brand-new account with zero saved cafés, zero
      visits, zero rewards; `/discover` with filters that match nothing.
- [ ] **Failed uploads** — try uploading a non-image file to the receipt
      form, a file over 8MB, and (if you can simulate it) a dropped
      connection mid-upload.
- [ ] **Expired session** — sign in, then clear cookies (or wait long
      enough) without signing out, and try submitting the quiz or uploading
      a receipt. **Known, documented gap, not fixed this phase**: the error
      you'll see is a plain "Not signed in." message with no automatic
      redirect to `/login` — a real error, not a crash, but not maximally
      helpful either. Confirm it's at least not confusing enough to block
      someone from recovering (they can always navigate to `/login`
      manually).
- [ ] **Incorrect inputs** — mismatched password confirmation, an
      already-registered email at signup, an invalid neighbourhood/PIN,
      out-of-range values anywhere a number is expected. Validation is
      thorough and unit-tested for the admin side (CSV import, reward
      items) — worth confirming the member-facing side feels equally clear
      in practice, not just correct.

## Highest-impact issues identified this phase

1. iOS Safari zoom-on-focus (fixed — see above). Was the single highest-impact
   item found: it affected the first-touch signup/login experience for
   every iPhone visitor.
2. `100vh` viewport issue on the café portal login (fixed — see above).
   Lower reach (café staff, not members) but a bad first impression for a
   new pilot café's very first interaction with their portal.
3. Session-expiry messaging (documented, not fixed — see "Expired session"
   above). Real but low-frequency; flagged for a future pass rather than a
   rushed multi-file change now.
