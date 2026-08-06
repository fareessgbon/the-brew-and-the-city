# BREW AND THE CITY — Product Spec v3.6

**One line:** A café discovery app that matches you to your next favourite spot the way a dating app matches you to a person — taste profile, mutual friends, and what you're in the mood for right now.

**Status:** Pre-launch spec. No product code written; the pre-launch site (§0.4) is the only thing that should ship first. This document is the input to the build.
**Author:** Reese
**Date:** August 2026 · **Market:** Calgary, Alberta — Founding Partner launch city (§3.0)
**v3.6 change:** added §0.4, a no-account pre-launch phase (awareness + two validation surveys, modelled on Caught Sipping's live Tampa Bay site) that ships before any signup, quiz, or account exists. Nothing else in the product spec changed — this only inserts the missing step in front of it.

---

## 0. How to read this document

| Section | For |
| --- | --- |
| 0.4 | **The pre-launch site — ships before anything else. Read this first if you're about to publish something.** |
| 1–3 | Positioning, naming, business model — read before anything |
| 4–6 | Brand system + design tokens — hand to whoever builds UI |
| 7–9 | The matching engine — the actual differentiator, read carefully |
| 10–12 | Data model, API, screens — the build handoff |
| 13–15 | Café-side portal, phases, open questions |

Anything marked **[DECIDE]** is a real open question that blocks a build decision. Anything marked **[ASSUMED]** is a placeholder I chose so the spec stays coherent — override freely.

---

## 0.4 Pre-launch phase — what ships before any account exists

**This ships first — days, not weeks — and none of it touches auth, the matching engine, or the data model.** Its only two jobs are building social awareness in Calgary and collecting real answers to the open questions in §15. It is modelled directly on the Caught Sipping site, which is running the same play in Tampa Bay right now: no login, no "create account," no live product. A hero, a partner pitch, two surveys, and an Instagram handle doing the actual work.

**The rule this phase exists to enforce:** nobody signs up for anything. There is no account, no email + magic link (§6.1), no Supabase Auth call, no user row beyond a waitlist email address. The pre-launch site's entire job is to be looked at, shared, and filled out — not logged into.

### What ships

| Page | Purpose | What it is NOT |
| --- | --- | --- |
| `/` (hero) | State the idea in one screen — matched to your next favourite Calgary café — and point everywhere else. One email field to **join the list**, stored as a waitlist row, never an account. | Not a live matching quiz resolving to real cafés. You have no seeded cafés yet — that's homework item 1 below. Do not fake a Proximity Map with placeholder pins. |
| `/for-cafes` | The Founding Partner pitch (§3.0), the FAQ (§13.7), the "your café doesn't stop getting discovered after the first visit" framing (§12.1b) | Not a portal, not an application that provisions a café account. It ends in the café-side survey (§13.6.1) or a plain "email us" link. |
| `/help-shape-the-app` | Both validation surveys (§13.6), each on its own step-numbered sub-route — `/help-shape-the-app/cafe-partner-survey` and `/help-shape-the-app/consumer-survey`, matching the URL pattern already visible in the Caught Sipping screenshots | Not gated behind a login. One click from the nav, no account required to answer either survey. |
| Instagram (@brewandthecity) | Where the actual social-awareness work happens — café features, quiz-style polls, behind-the-scenes seeding visits, "why this café scored the way it did" posts | Not a hard-sell funnel. Personality and local presence first; the site does the converting. |

### The nav, copied because it's correct

Caught Sipping's live nav is two links and a button: **Help Shape the App** · **Catch Us on Instagram**. No "Sign Up," no "Log In," no "Get the App." Use the same restraint — every nav item on the pre-launch site should be something a visitor can do without an account. Footer repeats the same links plus **Join the Waitlist**, **For Cafés**, and the legal pages.

### What it proves before you write a line of matching code

| Question | Where the answer comes from |
| --- | --- |
| Will 15 cafés actually say yes? | `/for-cafes` visits + café survey completions — target 20–30 responses (§13.6.1) |
| Is $4 reimbursement / $49 founding rate / $89 Partner rate in the right range? | Café survey steps 4–5 (§13.6.1) |
| Do Calgarians care enough to leave an email before the product exists? | Waitlist signups from `/` |
| Which perk framing lands — discovery, savings, or novelty? | Consumer survey steps 5–6 (§13.6.2) — target 100+ responses |
| Which neighbourhoods and café names come up unprompted? | Free-text fields on both surveys, read manually, not just tallied |

Nothing here is a build risk. It's copy, a form tool (Typeform/Tally, per §13.6), a single waitlist table, and an Instagram account. Ship it, let it run for at least two to three weeks alongside the homework in §0.5, and only start Phase 1 of the v1 cut line once the surveys have real numbers in them — guessing the same four answers this phase is designed to collect is the exact mistake it exists to prevent.

**Alberta privacy note:** even a single email field is a collection of personal information under PIPA (§20). Ship a one-paragraph privacy notice on the waitlist form before the first address is collected — what's stored (email only), why (to notify at launch), and how to unsubscribe. This is a much lighter lift than the full policy §20 requires before the real app collects location and receipt photos, but it isn't optional just because the phase is "just a landing page."

---

## 0.5 The v1 cut line — read this before writing any code

**This document describes the product. It does not describe the first build.** Handed over whole, it is roughly nine months of work and the coder will either build for nine months or pick a subset arbitrarily. This section is the subset.

### In v1 (~9 weeks)

**This table starts after §0.4's pre-launch site is already live and has run for a few weeks.** Order 1 below is the *public* marketing site — the one with a real signup and a live quiz against seeded cafés. It is not the first thing that ships; §0.4 is.

| Order | Scope |
| --- | --- |
| 1 | Public marketing site — hero mini-quiz **with live signup**, `/for-cafes`, partner application (§12.1b). Replaces §0.4's no-account pre-launch site once cafés are seeded and matching exists. |
| 2 | **Admin console** (§16) — before the consumer app, because nothing works without seeded cafes |
| 3 | Email + magic link auth (§6.1) |
| 4 | Café preference quiz, 9 questions × 4 options → drink category + taste vector + radius → Proximity Map, top 3 (§8.2a, Appendix A) |
| 5 | Matching layers 1 (taste) and 3 (context), needs-first weights (§7.2, §7.4, §7.5) |
| 6 | Map, search, Cafe Profile with menu (§8.3, §8.2c) |
| 7 | "Not it" refinement loop (§8.2d) |
| 8 | The City Card: receipt upload, OCR, auto-approve, stamp card, redemption (§3.1a, §3.1f) |
| 9 | Minimal Cafe Portal: receipt queue, menu submission, live stamp counter (§13.5) |
| 10 | Notifications (§17), empty/error states (§18), analytics events (§19) |

### Explicitly NOT in v1

| Deferred | Why |
| --- | --- |
| **Friends, feed, café sharing** | Same reason. |
| **Matching layer 2 (social)** | Contributes literally nothing at zero friends — the weight table already sets `wS = 0`. Build the interface, return the global mean, wire it up later. |
| **City Picks / Elo** (§8.6) | The ranking mechanic is excellent and it is not what makes v1 useful. Without it, cafe vectors come from admin seeding only — which is what happens for the first months regardless. |
| **Awards** (§8.2b) | Requires 20+ City Picks per café per axis. Impossible at launch by definition. |
| **Insights reports** (§12.4) | Quarterly. The first one is due three months after launch. |
| **Stripe billing** | You will have ≤15 partners. Invoice by hand. A billing integration for 15 customers is two weeks spent badly. |
| **Native apps** | PWA first. Nothing in v1 needs background geofencing. |

### The rule

If a feature is not in the table above, it does not get built in v1, **including** anything specced elsewhere in this document. When in doubt the answer is no. Every one of these can be added later against a schema that already anticipates it — which is why the schema in §10 is complete even though the build is not.

### Before the coder starts — your homework, not theirs

0. **Ship the pre-launch site (§0.4).** Hero + waitlist email, `/for-cafes`, `/help-shape-the-app` with both surveys, Instagram live. This is a landing page and two form embeds, not a build — do it first, and let it run in parallel with everything below. Nothing in this list needs to finish before the site goes up.
1. **Seed 60 Calgary cafes in a spreadsheet.** All 7 vector dimensions, all `cafe_attributes`, hours, neighbourhood. Roughly 45 minutes each, in person (§13). This is the gate on Phase 2 and nobody else can do it.
2. **Test the algorithm in Sheets.** Enter your own vector, compute weighted Euclidean against all 60, look at the top 10. If they aren't cafes you'd actually like, fix the weights *before* the build, not after.
3. **Register brewandthecity.com and the handles** (§2.1a).
4. **Talk to five cafes.** Confirm the $4.00 reimbursement rate, the $89 price, and what share of their drink sales is matcha — cross-check against whatever the café survey (§13.6.1) has already told you by then.
5. **Get an accountant on GST.** Once you cross $30k/yr you must register and charge 5% on subscriptions, and the reimbursement's tax treatment needs a real answer.
6. **Read the two surveys before treating the numbers as real.** Target 20–30 café responses and 100+ consumer responses (§13.6) before order 1 of the v1 build starts. Five replies is anecdote, not a green light.

---

## 1. Positioning

### 1.1 The problem

People screenshot cafés and never go. The screenshots die in the camera roll. Google Maps ranks by review volume, which surfaces chains and tourist traps. Instagram surfaces whatever is currently aesthetic, not whatever you'd actually like. Nobody has a good answer to "where should *I* get coffee today."

### 1.2 The insight

Café preference is *taste-shaped*, not *quality-shaped*. Two people can both be right that a café is a 5 and a 2. The person who wants a silent 3-hour study session and the person who wants a loud 20-minute catch-up are looking for opposite things and currently get the same ranked list.

So: stop ranking cafés. Start matching them.

### 1.3 How this differs from Caught Sipping

Caught Sipping is a **map with a membership attached** — discovery is a passive layer (saves, rankings, friend feed) and the paid product is a punch-card-by-subscription. The two halves don't reinforce each other much.

BREW AND THE CITY is a **matching engine with a map attached**. The name already carries the mechanic — "match made in heaven" means *the perfect pairing*. That's the product, not a tagline.

Practical consequences of that difference:

| | Caught Sipping | BREW AND THE CITY |
| --- | --- | --- |
| Core screen | Map | Daily match |
| Cold start | Empty map, empty feed | Quiz output — useful on day one |
| Reason to open daily | Check in somewhere | See today's match |
| What your data buys you | A visit log | A better match tomorrow |
| Membership rationale | Cheaper coffee | Try the match without risking $8 |

That last row matters. Their credits are a discount mechanic. Yours are a **risk-removal** mechanic — the whole objection to trying a new café is "what if it's bad and I wasted $8." A free café item at a 91% match is a much tighter pitch than a generic discount at a random partner.

### 1.4 Target user

**[ASSUMED]** Primary: 20–34, urban, drinks matcha or specialty coffee 3+ times a week, already screenshots cafés, already uses Beli / Letterboxd / Goodreads-style ranking apps. Skews female. Skews toward people who *moved somewhere recently* — highest-intent segment, because they have no rotation yet.

Secondary: locals who feel stuck in a two-café rut.

### 1.5 Launch market — Calgary, Alberta **[DECIDED]**

Calgary is a defensible pick, and better than it looks on paper.

**What's actually there.** Alberta had roughly 17 active independent roasters as of May 2026, and Calgary is the deepest cluster in the province with about 10 — three of them carrying international competition credentials. Per capita, the city has produced more barista champions than anywhere in Western Canada outside Vancouver. The anchors: Phil & Sebastian, Monogram, Rosso, Fratello (roasting in Calgary since 1985), Analog, Calgary Heritage Roasting, Sought x Found, Paradigm Spark, Eight Ounce Coffee Club, Deville. Multi-location operators like Rosso mean one conversation can yield several venues.

**Why it works for this product specifically:**

- **Density where it counts.** Beltline, Mission/17th Ave, Inglewood, Kensington, Bridgeland, and downtown Stephen Ave are all walkable clusters with multiple credible cafes inside a few blocks. That is exactly the geometry the matching engine needs — "10 minutes away" has to mean something.
- **Competition culture = strong taste opinions.** A city that argues about coffee is a city that will rank cafes.
- **You're local.** §13 budgets 45 minutes per cafe of in-person vector seeding. That is realistic in Calgary and would not be remote.
- **Underserved by discovery.** Calgary's scene gets far less national coverage than Toronto's or Vancouver's, which means locals genuinely don't know what's two neighbourhoods over.

**What to plan around:**

- **Winter kills walk-up discovery.** From November to March, "a great cafe 15 minutes away" is a much harder sell than it is in Tampa. Two mitigations, both worth building: weight distance more heavily in the match score during winter months (a `season_distance_multiplier` in `constants.ts`), and lean the City Card on winter — a free café item is a *reason to go outside*, which is a stronger seasonal hook than it would be anywhere warm. Run a winter multiplier campaign (double stamps in January) and sell it to partners as a January traffic package.
- **Car city.** Median trip is a drive, not a walk. Default `max_radius_m` is 12000, and quiz Q9 lets the user set their own (Appendix A). The map also needs to be legible at a zoom level that covers the quadrant, not the block — the map needs to be legible at a zoom level that covers the quadrant, not the block.
- **~1.4M metro, but spread thin.** Target the walkable clusters above for the Founding Partner cohort rather than trying to cover the city. Density beats coverage for v1.

**Target for launch:** 60 seeded cafes, 15 Founding Partners, all within the six clusters named above.

---

## 2. Naming

### 2.1 The name — BREW AND THE CITY **[REBRANDED v3.0]**

The product is no longer matcha-first. It covers **coffee, matcha, tea and beverages generally**, and the name now says so.

**Clearance check.** Nobody is using "BREW AND THE CITY." Two adjacent names exist and neither is the same string, but both are worth knowing before you file anything:

- **City Brew Coffee** — Montana, operating since 1998, ~30 locations across four states, and they have their own ordering app. Different word order, same two words.
- **BREW CITY®** — a registered McCain Foods brand (beer-batter foodservice products). Registered mark, different class.

Neither blocks you — different string, different market, different class — but a trademark examiner weighs *phonetic and commercial* similarity, not exact matching. Budget for a proper clearance search before you spend on signage or filing.

**The Sex and the City echo.** That is the joke, and it works — it signals city, sociability, and a series of small urban discoveries rather than a single product. Worth knowing: Warner Bros. Discovery does enforce on the "… and the City" construction. The formula is widely used by small businesses and rarely pursued at your scale, but keep the visual identity well clear of the show's — no pink script, no Manhattan skyline, no font that reads as the title card. Own the pun; don't borrow the look.

### 2.1a What the rebrand costs and what it buys

**Say the cost out loud, because it is real.** The previous positioning (§2.3) argued: market matcha, build café. That was a *winnable* claim — "the best way to find matcha in Calgary" is a title you could hold by month three. "The best way to find coffee in Calgary" is a fight with Google Maps you cannot win in year one. **You have traded a sharp wedge for a broad category.**

**What it buys, which is not nothing:**

- **It is a city brand, not a drink brand.** BREW AND THE CITY works in Vancouver, Toronto and Seattle without a rename. Matcha Matchup would have needed genericising at expansion, which is expensive and confusing.
- **It matches Calgary's actual market.** Calgary is coffee-first — Monogram, Phil & Sebastian, Rosso and Fratello are roasters. The old name forced a permanent explanation that the product wasn't matcha-only (§15, open question 5). That explanation is now unnecessary.
- **It removes a self-imposed ceiling.** Matcha is a small share of most Calgary menus. Every drink now counts, which widens both the funnel and the café pitch.

**The wedge you now need instead.** Category breadth is a liability without one, so the differentiator has to move from the *drink* to the *method*: nobody else matches you to a café by taste and by what you need right now. Lead with the mechanic, not the beverage. Concretely: *"Everyone has a coffee app. Nobody has one that knows what you actually like."*

**[DECIDE]** register `brewandthecity.com`, `.ca`, and `@brewandthecity` on Instagram and TikTok before any design work. Same one-string rule as before (§2.1b).

### 2.1b Domain and handle

| Surface | Handle |
| --- | --- |
| Website | **brewandthecity.com** |
| Instagram / TikTok | **@brewandthecity** |
| App stores | **BREW AND THE CITY** |
| Email | hello@brewandthecity.com |
| Café Portal | portal.brewandthecity.com |

Defensive registrations, all 301'd to the .com: `brewandthecity.ca` (Canadian users will try it), `brewandthecity.app`, and `brewinthecity.com` (the likely misremembering).

### 2.2 Product vocabulary — built around the city **[REWRITTEN v3.3]**

The vocabulary should now sound like a trusted local café guide, not a dating app or a sports tournament. Use familiar language about places, neighbourhoods, routines, and going out in the city. Keep **Match %** because the matching method is still the product's clearest differentiator; remove phrases such as *On Deck*, *Rounds*, *Chemistry*, and *setting them up*, which belong to the retired matchup framing.

| Concept | Product name | How it appears in the product |
| --- | --- | --- |
| Places you want to try | **City List** | “Save to City List” · a personal list of cafés to visit next |
| Places you have visited | **Regulars** | A history of visited cafés, ordered by repeat visits and personal ranking |
| Your taste profile | **Your Taste** | The user's drink, atmosphere, pace, price, food, and travel preferences |
| Compatibility score | **Match %** | The clearest expression of how well a café fits this user right now |
| Daily recommendation | **Today’s Pick** | One practical café recommendation based on taste, need, distance, and opening hours |
| Head-to-head ranking | **City Picks** | Quick post-visit comparisons that improve personal rankings and café vectors |
| The three ranking axes | **The Drink / The Space / The Return** | Drink quality · environment and usability · how strongly the user wants to return |
| Loyalty program | **The City Card** | One cross-café card: five verified visits, then one eligible café item free |
| One loyalty stamp | **A Visit** | “You’re 2 visits away from your free item” |
| The reward | **Your Free Item** | Plain language at redemption; the eligible item may be a drink, pastry, or small food item |
| Café subscription tiers | **Listed / Partner / Featured / Founding Partner** | Clear commercial names that owners understand immediately |
| A café’s public page | **Café Profile** | Photos, menu, hours, amenities, Match %, and directions |
| Sharing a café | **Send This Spot** | Direct, natural sharing language without dating terminology |
| User location control | **Near [neighbourhood]** | A visible, editable location chip such as “Near Beltline” |

**Naming rules:**

1. **Use city language for discovery.** Prefer *City List*, *Today’s Pick*, *this spot*, *nearby*, and neighbourhood names.
2. **Use café language for habit.** Prefer *Regulars*, *visit*, *order*, *menu*, and *return*.
3. **Use plain language for money and rewards.** Say *free item*, *reward available*, *receipt approved*, and *redemption recorded*. The app names the exact eligible item before redemption.
4. **Keep Match % literal.** It is the product method, not decorative brand copy.
5. **Do not turn every sentence into a city pun.** The name carries the personality; the interface should remain easy to understand.

**Engineering note:** existing internal identifiers such as `on_deck` and `matchups` may remain in the database and API to avoid unnecessary migrations. All user-facing interface copy must use **City List** and **City Picks**.

**Voice rule:** branded language belongs in navigation, section titles, onboarding, and empty states. Errors and operational messages stay direct: *“Couldn’t save that café — check your connection.”* Never use trophies, game language, dating language, confetti, or fake celebration for routine actions.

---

### 2.3 Positioning — all beverages, one method **[REWRITTEN v3.0]**

The old lane ("market matcha, build café") is retired. The name is now category-wide, so the positioning has to be too.

| | Was | Now |
| --- | --- | --- |
| Marketing line | *The matcha app that knows your taste* | *Every good café in Calgary, matched to your taste* |
| Wedge | The drink | **The method** |
| Scope | Matcha-first, coffee tolerated | Coffee, matcha, tea, everything |

**The differentiator moved from the beverage to the mechanic**, and every piece of copy has to carry that weight now:

> Everyone has a coffee app. Nobody has one that knows what you actually like.

**Matcha keeps a specific job, not a general one.** It stays the most distinctive *content* angle — matcha drinkers are more intentional, more social, and more likely to complete a taste quiz, so matcha roundups and the matcha awards category will over-perform. Use it as a recurring content pillar and an award axis. Do **not** use it as the positioning.

**Practical consequences:**
- Q1 captures the user’s primary drink category; Q2 adapts to that category and seeds `drink_profile` (Appendix A)
- `drink_profile` is a general beverage axis (§7.1)
- The City Card reward may be a beverage, pastry, small food item, or café-selected special from the active monthly list (§3.1g)
- Awards split by drink type — Best Matcha *and* Best Espresso *and* Best Filter (§8.2b)
- The brand system drops its matcha-specific signals (§4.1)

---

## 3. Business model

#### 2.4 The Google Maps test — one line per surface

Google Maps has every café. Yelp has every review. Instagram has every photo. Nowhere in this spec does it say, in words a user would read, why anyone opens BREW AND THE CITY instead.

**The rule: every product surface carries one sentence that answers "why not just use Maps?"** Not marketing copy — a plain line sitting on the screen, where a first-time user meets that surface. It disappears after the third session.

| Surface | The line |
| --- | --- |
| Quiz intro | *"Nine questions. Then we stop showing you the closest café and start showing you the right one."* |
| Proximity Map | *"Distance is compatibility. The closer a café sits to you, the more it matches how you actually drink."* |
| Top 3 result | *"Three, not thirty. Ranked by what you told us, not by review count."* |
| Café Profile | *"We tag every menu, so we can tell you what to order — not just where to go."* |
| Menu / 100% state | *"100% means we found your drink here, not that everyone likes this place."* |
| Awards | *"Decided by head-to-head picks from locals, not by who has the most reviews."* |
| City Card card | *"Five visits anywhere in the network. One card, not six punch cards in your wallet."* |
| "Not it" | *"Tell us what's wrong and we'll fix the next one. Maps can't do that."* |

**Why this earns its space.** Review-count ranking rewards volume, which rewards chains and tourist traps — the exact failure §1.1 is built against. Users know something is off about how they currently choose cafés; they have never had it named. Naming it is what makes a pretty feature read as a better method.

**Constraint:** one line per surface, never two. Shown to new users only, dismissed permanently after session three. A product that keeps explaining itself is a product that doesn't work.

---

## 3.0 Calgary launch model — the first 15 partners are free **[REVISED v3.4]**

**The first 15 approved cafés that join BREW AND THE CITY become Founding Partners and pay $0 for their first six months.** After that period, they may continue at **$49/month, locked for 24 months**, downgrade to a free Listed profile, or leave. They are never forced into a surprise invoice.

This is not the same as making every café free. The product needs two clear levels from launch:

1. **Listed cafés** make the discovery app complete and trustworthy. They can appear for free even if they do not participate in the loyalty program.
2. **Partner cafés** actively participate in menu matching, rewards, customer insights, and promotion.

The first 15 receive the Partner experience free because BREW AND THE CITY needs launch partners, real usage, testimonials, and operational feedback before asking cafés to pay.

### 3.0.1 Launch offer at a glance

| Level | Launch price | Availability | Main purpose |
| --- | ---: | --- | --- |
| **Listed** | **$0 ongoing** | Any eligible café | Complete, honest city coverage |
| **Founding Partner** | **$0 for 6 months** | First 15 approved cafés | Build the launch network and case studies |
| **Partner** | **$89/month** | Available after the founding cohort fills | Loyalty, menu matching, promotion, and insights |
| **Featured** | **$189/month** | Maximum 8 cafés at a time | Higher-touch content and marketing support |

Annual Partner and Featured plans receive two months free. Founding Partners keep the option to continue at **$49/month for 24 months**, even after the public Partner rate becomes $89.

### 3.0.2 “First 15” means approved, not simply first to submit

A Founding Partner place is confirmed only when the café:

- operates a public café location in the launch area;
- offers at least one coffee, matcha, tea, chai, refresher, or other prepared beverage;
- completes the onboarding visit and supplies accurate menu and hours information;
- appoints one owner, manager, or marketing contact;
- agrees to the Founding Partner requirements below;
- signs the one-page agreement; and
- is a good fit for the launch map’s neighbourhood coverage.

BREW AND THE CITY may hold places for underrepresented neighbourhoods so all 15 cafés are not concentrated on one block. An application does not guarantee a Founding Partner place.

### 3.0.3 What a Founding Partner receives for free

During the six-month launch period, every Founding Partner receives:

- a complete Café Profile with hours, address, photos, amenities, accessibility details, and contact links;
- a tagged digital menu so users can receive specific drink recommendations;
- inclusion in personalized Match %, Today, Discover, Map, and “worth the drive” results based only on fit;
- City Card stamp participation, with the option to publish a monthly list of eligible free items for reward redemption;
- a Café Portal showing profile views, saves, direction taps, stamps, first-time visitors, and reward redemptions;
- a weekly performance email and one launch-period insight summary;
- an onboarding photography mini-session with approximately 5–8 edited images that the café may reuse;
- one dedicated launch feature on BREW AND THE CITY’s social channels;
- inclusion in rotating group roundups, seasonal guides, and Monday drops when relevant;
- a Founding Partner badge, window decal, and counter card;
- a permanent place on the public Founding Partners page;
- eligibility to host or participate in the launch event; and
- direct input into the early product roadmap.

**Do not promise every Founding Partner a custom reel every month or a quarterly ten-image shoot.** Delivering that to 15 cafés would turn the launch into a full-time agency. The free offer should be generous, specific, and achievable.

### 3.0.4 What BREW AND THE CITY asks from Founding Partners

In exchange for the free launch package, each Founding Partner agrees to:

1. **Complete a 45–60 minute onboarding visit.** BREW AND THE CITY records the café’s attributes, photographs the space and one or two menu items, and sets up the profile.
2. **Provide an accurate menu and prices.** The café confirms major changes at least once each month.
3. **Keep hours and closure information current.** Holiday or temporary changes should be submitted before they take effect whenever possible.
4. **Designate one point of contact.** This person receives the weekly email and handles portal questions.
5. **Support City Card stamps.** A verified beverage purchase at the café may earn a Visit on the member’s City Card. This does not require the café to give away an item.
6. **Choose whether to participate in free-item redemption.** Reward redemption is optional. A Founding Partner may participate every month, repeat a previous month, or pause without losing its profile, Match %, menu matching, analytics, or promotional eligibility.
7. **Submit the next month’s eligible-item list by the 25th.** A participating café submits between one and five eligible items for the following calendar month. Eligible items may be beverages, pastries, small food items, or café-selected specials.
8. **Set the operating rules.** The café selects the monthly redemption cap, valid days and hours, item quantities, included modifications, and excluded upgrades. The launch default is a maximum of **10 total redemptions per month**, but the café may select a lower cap or voluntarily approve a higher one.
9. **Make the approved item fully free.** The member pays $0 for the eligible item exactly as displayed in the app. The café may sell optional extras separately, but an upgrade or add-on can never be required to receive the base reward.
10. **Review flagged receipts within 72 hours.** Most receipts should auto-approve; only exceptions require attention.
11. **Brief front-counter staff.** BREW AND THE CITY supplies a short script, monthly reward sheet, and counter card. No POS integration or lengthy training is required.
12. **Display the partner counter card or decal** in a reasonable visible location during the launch period.
13. **Allow use of the café’s name, logo, menu, and approved imagery** for its profile and BREW AND THE CITY promotional content.
14. **Give 30 days’ notice to leave the active partner program.** The café can remain as a free Listed profile unless it asks to be removed.

The café never has to change its POS system, provide customer data, offer unlimited free items, or participate in reward redemption at all. Choosing not to offer a monthly reward does not affect personalized matching or discovery.

### 3.0.5 Monthly eligible-item menu and reimbursement

Reward redemption uses a **café-defined monthly menu**, not an open-ended “anything up to $4” promise.

#### Monthly submission schedule

- By the **25th of each month**, a participating café submits its eligible free items for the next calendar month.
- The approved list becomes active on the **first day of the following month** and expires at the end of that month.
- The café may choose **Submit a new list**, **Repeat this list next month**, or **Pause rewards next month**.
- If no new list is submitted and automatic repeat was not selected, redemptions pause automatically. The café remains fully visible and matchable.

For every eligible item, the café submits:

- item name and category;
- regular menu price;
- size or portion;
- a short customer-facing description;
- included milk choices, flavours, or modifications;
- excluded upgrades and add-ons;
- valid redemption days and hours;
- monthly quantity or shared café-level cap;
- whether the item is limited or available while supplies last;
- the agreed reimbursement amount once the café is on a paid plan; and
- an image when available.

The café may list **one to five eligible items**. One completed City Card unlocks **one item** from the active list.

#### During the six-month Founding period

- Reward redemption is optional.
- When the café opts in, it contributes the redeemed eligible items.
- The café selects its own monthly cap, with **10 total redemptions per month as the launch default maximum** unless it voluntarily chooses more.
- The café controls valid redemption days and hours.
- Reaching the cap pauses new redemptions until the next month but does not remove the café from matching, discovery, menu recommendations, analytics, or promotion.
- The member receives the approved item for **$0**.

#### After a Founding Partner begins paying $49/month

- BREW AND THE CITY reimburses the agreed amount for each verified redeemed item, initially targeted around **$4.00**.
- Reimbursement may be set per item because a drip coffee, pastry, and matcha latte have different economics.
- The member still pays **$0** for the approved base item.
- The café chooses items that fit the agreed reimbursement or voluntarily absorbs the difference. BREW AND THE CITY does not advertise an item as free and then require the member to pay a balance.
- Paid size upgrades, extra shots, premium toppings, or other optional additions may be purchased separately, but they are not part of the reward.
- The café may continue to set monthly caps and redemption windows.
- The café receives a monthly statement showing each item redeemed, reimbursement owed, redemption time, first-time customer status where privacy thresholds allow, and any attached paid purchase captured by the program.

This transition gives the café something new when billing begins: BREW AND THE CITY starts covering the agreed reward cost instead of merely introducing a fee.

#### Availability and substitutions

- A café can mark an eligible item temporarily unavailable in the Café Portal.
- Other active items remain redeemable.
- An unavailable item may only be replaced by another item already approved for that month.
- Staff must not substitute a more expensive item that requires the member to pay unless the member independently chooses an optional paid upgrade.
- The app shows active items, valid hours, and whether the café’s monthly redemption cap has been reached **before** the user starts redemption.

### 3.0.6 What happens after six months

Approximately 30 days before the free period ends, each Founding Partner receives a clear performance summary and chooses one of three paths:

| Choice | What happens |
| --- | --- |
| **Continue as Founding Partner** | $49/month, locked for 24 months; keeps all Partner benefits |
| **Upgrade to Featured** | Moves to the current Featured rate, subject to one of 8 available slots |
| **Return to Listed** | Pays $0; keeps a basic profile and honest Match %, but loses loyalty, menu matching, portal analytics, and guaranteed promotion |

No café is automatically charged without a payment method and written reminder. A café that does not choose is downgraded to Listed rather than invoiced unexpectedly.

### 3.0.7 What the founding program must prove

| Question | Metric | Initial target |
| --- | --- | ---: |
| Does matching send people somewhere useful? | Match-to-visit rate for 80%+ matches within 30 days | ≥25% |
| Do users return? | Day-30 member retention | ≥25% |
| Does the loyalty card change behaviour? | Completed cards per active member per quarter | ≥1.0 |
| Do cafés pay attention to the data? | Weekly email or portal open rate | ≥50% |
| Do cafés see enough value to continue? | Founding Partners choosing the $49 plan | ≥10 of 15 |
| Can the program be operated reliably? | Flagged receipts resolved within 72 hours | ≥90% |

The founding cohort is a validation program, not a permanent giveaway. The success test is whether cafés choose to continue once they have seen real traffic, content, and customer insight.

---

### 3.1 Revenue — café subscriptions **[ACTIVE AFTER FOUNDING OFFER — REVISED v3.4]**

**The model in one line:** cafés pay for verified menu matching, analytics, promotion, and optional loyalty participation. BREW AND THE CITY keeps discovery honest while giving active partners tools that a free listing does not include.

All Partner and Featured cafés can issue City Card stamps. Offering free-item redemption is optional and controlled through a monthly eligible-item menu. During a participating café’s six-month Founding period, the café contributes the redeemed items within its chosen cap. Once it begins paying, BREW AND THE CITY reimburses the agreed amount per verified item under §3.0.5.

#### 3.1a The City Card — the loyalty card **[UPDATED v3.4]**

> Every member gets a card. Five paid beverage visits, then choose **one eligible café item free**.

**Personal, not per-café.** One card per member is carried across the active Partner network. A partner may issue stamps without offering a free-item menu. Redemption is available only at cafés that have opted in and published an active eligible-item list for that month.

| Rule | Value |
| --- | --- |
| Who has a card | **Every registered member.** Free and automatic at signup |
| Stamps required | 5 |
| What earns a stamp | A verified receipt containing at least one beverage purchase from an active Partner café (§3.1f) |
| The reward | One item from a participating café’s active monthly eligible-item list (§3.1g) |
| Eligible reward types | Beverage, pastry, small food item, or café-selected special |
| Who funds it during Founding | The participating café, within its chosen monthly cap |
| Who funds it after payment begins | BREW AND THE CITY reimburses the agreed amount per verified item |
| Cost to the member | **$0 for the approved base item** |
| Repeat visits | Count, with a maximum of 2 stamps from one café per card |
| Member cap | Maximum **2 completed cards per member per month** |
| Stamp expiry | Stamps expire after 90 days of inactivity |

**The word “member” means anyone with an account.** There is no paid consumer tier (§3.1e). The card encourages discovery and repeat visits; it is not sold as a subscription.

#### 3.1a.1 The repeat-visit decision — read before building

Allowing repeats makes the card familiar and easy: it works exactly like the paper punch card in every cafe in Calgary, and people already understand it. That is a real adoption advantage and it is why you changed it.

**But it removes the mechanic the partner pitch was built on.** Under the old rule, five stamps meant five *different* cafes, so every completed card was five paid visits spread across the network — which is precisely what a cafe was buying for $89/mo. With unlimited repeats, a member can fill an entire card at the cafe they already go to. You would then reimburse $4.00 for a free item at a shop that already had that customer's loyalty, on a visit that was going to happen anyway. That is subsidising existing habit, not buying new traffic, and it is the opposite of what the subscription is sold as.

**Recommended middle ground — max 2 stamps per cafe per card.**

```
Card = 5 stamps
Max 2 stamps from any single cafe
→ a completed card touches at least 3 different partner cafes
```

This keeps the card feeling like an ordinary punch card (repeats are allowed, nobody is forced to hunt), while guaranteeing every reward you fund moved a member to at least two cafes beyond their usual. When a member tries for a third stamp at the same cafe, the app says so plainly and shows two nearby partners they haven't stamped, ordered by Match % — turning the block into the discovery moment the whole product exists for.

**[DECIDE]** three options, in order of my preference:

| Option | Cross-network effect | Partner pitch |
| --- | --- | --- |
| **2 stamps per cafe max** *(recommended)* | ≥3 cafes per card | Strong and honest |
| Unlimited repeats | Possibly 1 cafe per card | Weak — "we may bring you nothing new" |
| 5 different cafes (v1.4 rule) | 5 cafes per card | Strongest, but the card is work |

If you take unlimited repeats, the partner pitch has to change with it — sell the *app* (matching, menus, awards, insights) and treat the card as a bonus, rather than selling network traffic you can no longer promise.

#### 3.1a.2 The ratio that sells the program

Five paid beverage visits precede every free item:

```
Average qualifying beverage purchase                 ~$6.50
Member spend before reward                    5 × $6.50 = $32.50
Target reimbursement after Founding                    ~$4.00
Illustrative ratio                                     ~8 : 1
```

The exact ratio varies because the free item may be a drip coffee, latte, pastry, or small food item. The portal should calculate the real ratio for each café from verified purchases and the agreed item-level reimbursement rather than presenting $4.00 as universal.

**Reimbursement principle:** the café submits items it is comfortable offering at the agreed reimbursement. The member pays $0 for the base item. If an item’s regular price is above the reimbursement, the café either accepts the difference as a marketing cost or submits a different item. Optional paid extras are a separate purchase.

#### 3.1a.3 Liability control — mandatory

Reimbursement scales with completed cards and participating reward cafés, so it is the one cost that can outrun subscription revenue.

1. **2 completed cards per member per month, hard cap.** At 1,000 active members with 30% hitting the cap: 600 rewards × $4.00 = **$2,400/mo** worst realistic case.
2. **Five paid drinks per reward is itself the throttle.** Hitting the cap means ten paid partner visits in a month.
3. **Monthly platform ceiling in `constants.ts`.** Past a set total reimbursement budget, new paid-plan reward capacity pauses or queues to the next month with a plain in-app message. Never operate an uncapped reimbursement promise.

#### 3.1f Stamp verification — receipt upload **[NEW v1.5]**

**The flow, as specced by the founder:** the customer photographs their receipt, uploads it, the cafe confirms the purchase, and a stamp lands on their digital card.

This is the right instinct — a geofence proves you stood near a cafe, not that you bought anything, and you cannot reimburse against presence. But the flow as stated has one failure mode that will kill the program, and it needs a specific fix.

**The failure mode: latency.** If every stamp waits on a busy cafe owner to approve it, stamps arrive days late or never. A loyalty card that doesn't visibly fill up stops motivating anyone, and cafes will resent the queue within two weeks. Loyalty programs die of latency far more often than they die of fraud.

**The fix: auto-approve with a cafe dispute window.**

```
1. UPLOAD      Customer photographs the receipt in-app (also available on
               brewandthecity.com for desktop). Same session as purchase,
               or up to 48h after.

2. OCR         Server extracts: merchant name, date, time, line items,
               total. Google Cloud Vision or AWS Textract.

3. AUTO-CHECK  Stamp is granted IMMEDIATELY if all of:
                 • merchant matches a partner cafe (fuzzy match on name
                   or a registered merchant string)
                 • timestamp within the last 48h
                 • at least one drink line item
                 • receipt hash not seen before (see dedupe below)
                 • member has fewer than 2 stamps from this cafe on the
                   current card (per 3.1a.1)
               → roughly 85–90% of uploads clear here.

4. QUEUE       Anything failing a check goes to that cafe's portal queue
               with the receipt image. Cafe taps approve or reject.
               Auto-approves after 72h of no response — never let an
               unresponsive cafe block a customer's stamp.

5. DISPUTE     Cafes see every auto-approved stamp in the portal and can
               dispute within 7 days. Disputes are rare and are a fraud
               signal about the MEMBER, not about the cafe.
```

**Dedupe.** Hash `merchant_id + receipt_datetime + total_cents + last_4_of_receipt_number` and store it unique. This kills the two obvious attacks: uploading the same receipt twice, and a group photographing one friend's receipt. Also cap uploads at 3/day per member.

**Fraud budget, stated plainly.** Some fraud will get through, and that is fine. Your exposure per successful fraud is one $4.00 reimbursement, and the fraudster still had to submit four other legitimate receipts to reach it. Spending engineering effort to drive fraud from 3% to 0.5% costs more than the fraud does. Monitor it; don't over-build against it.

**Cafe-side burden — be honest about it in the sales conversation.** The queue should be near-empty most days. If a cafe's queue is consistently busy, their merchant string is mismatching in OCR and *you* fix it, not them. Track "% auto-approved" per cafe as an internal health metric; anything under 80% is a bug on your side.

**Privacy.** Receipt images are deleted 30 days after resolution. Store only the extracted fields and the hash. Say this in the privacy policy — people are uploading documents with their card's last four on them and they should know you're not keeping the picture.

#### 3.1g Which purchases and rewards count **[UPDATED v3.4]**

**A beverage purchase earns the stamp. The free reward may be a beverage, pastry, small food item, or café-selected special.**

This separates the behaviour BREW AND THE CITY wants to drive from the item a café is comfortable offering:

- **Stamp:** a verified receipt with at least one beverage purchased at an active Partner café.
- **Reward:** one item from an opted-in café’s approved monthly eligible-item list.
- **Member price:** $0 for the approved base item.
- **Café participation:** issuing stamps is part of the active Partner program; offering reward redemptions is optional month by month.

A participating café submits between one and five eligible items by the 25th for the following month. Each item must include its size or portion, included modifications, excluded upgrades, valid hours, availability, monthly quantity, and reimbursement amount when applicable.

Examples of valid eligible items:

- 12 oz hot or iced latte;
- regular drip coffee;
- standard matcha latte;
- chai or tea latte;
- croissant, cookie, or other pastry;
- small breakfast or snack item;
- rotating seasonal item selected by the café.

The eligible item must be genuinely free. The café cannot require the member to pay the difference between the menu price and the reimbursement. Optional extras may be purchased separately, but the base reward must remain available for $0.

If an item sells out, the café marks it unavailable and the member chooses another active item. Staff may not replace it with an unapproved item that requires payment.

**Matcha keeps a soft edge, not a hard rule.** Free-matcha campaigns, double stamps on matcha, and matcha-focused content remain useful campaign ideas, but the permanent City Card reward system covers all café categories.

**Verification stays simple:** OCR only needs to confirm that the qualifying purchase contained a beverage. The selected free item is verified through the redemption record, not through the original stamp receipt.

#### 3.1b Café participation levels **[REWRITTEN v3.2]**

| Level | Price | Capacity | Best for |
| --- | ---: | --- | --- |
| **Listed** | Free | Unlimited | Cafés that want an accurate presence without active promotion or loyalty participation |
| **Founding Partner** | Free for 6 months, then $49/month locked 24 months | First 15 approved | Early cafés willing to help test and shape the launch |
| **Partner** | $89/month or $890/year | Unlimited | Cafés seeking measurable discovery, loyalty traffic, menu matching, and customer insight |
| **Featured** | $189/month or $1,890/year | Maximum 8 | Cafés that also want recurring original content and higher-touch marketing support |

Payment never changes Match %, ranking, awards, or whether a café can appear in a user’s top three. Payment changes the services surrounding the match: menu detail, loyalty participation, analytics, content, and support.

#### 3.1b.1 Detailed benefits and requirements

##### Listed — free city presence

**What the café gets**

- Searchable placement on the city map and in café search.
- A basic Café Profile with name, address, neighbourhood, hours, website, Instagram, price band, and core amenities.
- An honest Match % calculated from the same matching rules as every paid café.
- Eligibility to appear in ordinary personalized results when it is genuinely a good fit.
- User actions such as saving the café, opening directions, and sharing the profile.
- Eligibility for data-driven awards when award features launch.
- A simple way to submit corrections to hours, contact information, and accessibility details.

**What Listed does not include**

- No City Card stamps.
- No monthly eligible-item menu, receipt queue, or reward redemption.
- No tagged digital menu or specific “order this drink” recommendation.
- No Café Portal analytics.
- No guaranteed Instagram, website, campaign, or newsletter feature.
- No partner decal or counter materials.

**Requirements**

- The café must be a legitimate public business with verifiable hours and location.
- Public information must be accurate and may be corrected by BREW AND THE CITY.
- The café must not ask for payment-based score changes or competitor suppression.
- BREW AND THE CITY may maintain a truthful public listing using public business information, subject to applicable law and correction requests.

##### Partner — the core commercial plan

**Everything in Listed, plus:**

**Discovery and menu matching**

- A complete, claimable Café Profile managed through the Café Portal.
- Full menu upload with drink type, price, sweetness, strength, milk options, dietary tags, and seasonal availability.
- Specific menu recommendations such as “Order the strawberry matcha” rather than only recommending the café.
- Eligibility for Today’s Pick and partner-only menu collections when fit qualifies.
- “100% match” states when a user’s preferred drink and requirements are available.

**The City Card**

- Ability to issue stamps for verified beverage purchases.
- Optional participation in free-item redemption, selected month by month.
- A Café Portal form for submitting one to five eligible items by the 25th for the following month.
- Café-controlled item quantities, monthly cap, valid days, and valid hours.
- Item-level reimbursement at the agreed amount after the Founding free period.
- Placement in “Where to earn your next visit” for all active partners.
- Additional “Redeem your free item here” visibility only while an active reward list is published.
- Monthly statements showing item-level redemptions and reimbursement totals.

**Promotion**

- Inclusion in the indexed public Partner directory.
- Eligibility for rotating themed group features, neighbourhood guides, new-menu roundups, and weekly drops.
- At least **one guaranteed group feature per quarter**, provided the café supplies current menu information and usable imagery.
- Organic social mentions when its menu or Match data fits a relevant story.
- One onboarding mini-shoot: at minimum one drink image and one interior image, with reuse rights provided to the café.

**Data and tools**

- Café Portal access for the approved owner or manager.
- Dashboard for profile views, saves, direction taps, stamps, first-time visitors, redemptions, and estimated customer activity.
- Weekly performance email.
- Quarterly written Café Insights summary when enough data exists to protect user privacy.
- Menu manager and flagged receipt queue.
- Ability to report incorrect menu tags or café attributes.

**Physical materials and support**

- Partner window decal.
- Counter card explaining The City Card.
- Staff quick-start instructions.
- Email support with a two-business-day target.
- Guided onboarding visit and first menu setup.

**Partner requirements**

- Maintain an active payment method after any free period.
- Assign one primary contact and one backup contact where possible.
- Confirm menu, price, and hours changes at least monthly.
- Review flagged receipts within 72 hours.
- If opting into reward redemption, submit or renew the next month’s eligible-item list by the 25th.
- Honour valid redemptions within the published item list, cap, and hours.
- Mark sold-out items unavailable promptly and provide only approved alternatives.
- Never require a member to pay a balance for the approved base reward.
- Use the portal to repeat, replace, or pause the reward list for the next month.
- Permit BREW AND THE CITY to use approved name, logo, menu, and imagery for the profile and included promotions.
- Give 30 days’ notice to cancel the paid plan. Cancellation downgrades the café to Listed unless removal is requested.

##### Featured — higher-touch content and insight

**Everything in Partner, plus:**

- **One dedicated social post or reel each month.** The format is selected based on the content available and channel strategy.
- **One story series each month**, normally 3–5 frames.
- **One quarterly photography mini-session** producing approximately 10 edited images, with reuse rights for the café.
- **One week of homepage or featured-collection placement per quarter.** This is promotional placement only and does not affect Match % or personalized ranking.
- Priority consideration for up to two seasonal or brand-funded campaigns per year.
- A 30-minute quarterly insight call reviewing performance, customer preferences, and common rejection reasons.
- Access to deeper aggregate insights such as which drinks drive saves, which needs the café serves best, and why users select “Not it,” subject to privacy thresholds.
- One-business-day email support target.
- Earlier access to new Café Portal tools and structured roadmap feedback.

**Featured requirements**

- Featured is capped at eight cafés because the content work is human labour.
- The café provides reasonable access for scheduled photography.
- Menu and seasonal information must be submitted by agreed campaign deadlines.
- Content approvals must be returned within three business days or the scheduled slot may move.
- The café appoints a person authorized to approve public-facing content.
- Featured status can never purchase a stronger score, a top-three result, or an award.

##### Founding Partner — first 15 approved cafés

The Founding Partner package is the launch version of Partner, not a separate permanent service tier.

**Founding Partner benefits**

- All Partner benefits free for six months.
- One dedicated launch post or reel.
- One launch photography mini-session with approximately 5–8 edited images.
- Founding Partner badge on the Café Profile and physical window decal.
- Permanent inclusion on the Founding Partners page, even after later downgrading.
- Eligibility to participate in or host launch events.
- Direct founder onboarding and early roadmap input.
- A written launch-period performance summary before the free period ends.
- Option to continue at $49/month, locked for 24 months.

**Founding Partner requirements**

- Complete onboarding and sign the one-page Founding Partner agreement.
- Support City Card stamps for verified beverage purchases.
- Choose whether to participate in monthly free-item redemption.
- When participating, submit one to five eligible items by the 25th for the following month.
- During the free period, contribute redeemed items within the café’s chosen cap; the launch default maximum is 10 total redemptions per month.
- Keep menu and hours information current.
- Review receipt exceptions within 72 hours.
- Display the supplied counter card or decal during the launch period.
- Brief staff using the supplied quick-start guide and monthly reward sheet.
- Participate in one feedback check-in during the first three months and one before the conversion decision.
- Permit aggregate results to be used in BREW AND THE CITY case studies; naming the café in a case study requires its approval.

**What Founding Partners are not promised**

- They are not promised a custom post every month.
- They are not promised Featured-tier quarterly photography.
- They are not guaranteed more impressions, a higher score, or a place in anyone’s top three.
- They are not locked into a paid contract merely because the free period ends.

#### 3.1b.1a Simple comparison sheet

| Benefit | Listed | Founding | Partner | Featured |
| --- | :---: | :---: | :---: | :---: |
| Searchable map listing | ● | ● | ● | ● |
| Honest Match % | ● | ● | ● | ● |
| Complete claimed profile | — | ● | ● | ● |
| Tagged menu and named drink matches | — | ● | ● | ● |
| City Card stamps | — | ● | ● | ● |
| Monthly free-item redemption | — | Optional | Optional | Optional |
| Café Portal and weekly numbers | — | ● | ● | ● |
| Quarterly written insights | — | ● | ● | ● |
| Group promotional features | — | ● | ● | ● |
| Onboarding photography | — | 5–8 images | 2+ profile images | 10 images quarterly |
| Dedicated social content | — | 1 launch feature | — | 1 per month |
| Story series | — | Launch support | — | 1 per month |
| Quarterly insight call | — | — | — | ● |
| Homepage promotional placement | — | Launch rotation | — | 1 week/quarter |
| Founding badge and locked rate | — | ● | — | — |
| Price | $0 | $0 × 6 months, then optional $49 | $89/month | $189/month |

#### 3.1b.2 What money can never buy — put this on the perk sheet

Print it on the sales one-pager. It is a differentiator, not a disclaimer:

- **A higher Match %.** Not for any price. Scoring never receives subscription status (§5.1, §11.4).
- **A position in anyone's top 3.** Results are ordered by fit alone.
- **An award.** Awards come from head-to-head results by real members, and unpaid cafes win them.
- **Removal of a competitor** from the map or from results.
- **Suppression of a bad insight.** The quarterly report says what the data says.

"You cannot buy a better score here" is also the reason a genuinely good cafe wants to be on this platform rather than on Yelp. Say it in the first meeting.

#### 3.1b.3 The value stack — use this to close

What a cafe would pay for these separately in Calgary:

| Perk | Standalone cost |
| --- | --- |
| One dedicated influencer/content post | $150–$400 |
| Quarterly photo shoot | $300–$600 per session |
| Loyalty app SaaS seat | $50–$150/mo |
| Local Meta ads with someone running them | $300–$800/mo |
| Customer taste research | not purchasable at any price |
| **Featured tier** | **$189/mo** |
| **Partner tier** | **$89/mo** |

Don't present this as a savings calculation — owners discount those instantly. Present it as *"here's what each piece would cost you separately,"* and let them do the arithmetic themselves.

#### 3.1c How these numbers were derived

**What the cafe is comparing you to.** Price against the alternatives an owner already knows, not against your costs:

| Alternative | Calgary cost |
| --- | --- |
| One local micro-influencer post | $150–$400 one-off |
| A content photographer half-day | $300–$600 one-off |
| Meta ads, meaningful local reach | $300–$800/mo, plus someone to run it |
| A single loyalty-app SaaS seat | $50–$150/mo |
| **BREW AND THE CITY Partner** | **$89/mo, ongoing, plus a reward program you fund** |

$89 lands under a single influencer post and reads as obviously cheap for something recurring. That's deliberate — at launch you are selling into skepticism, and the price should not be the objection.

**Your cost to serve, per Partner cafe per month:**

```
Reimbursements attributable (~8 rewards)      $32
Group content production, amortized            $12
Infra (Supabase, Mapbox, Stripe, hosting)       $3
Support + account management                   $10
                                              -----
Cost to serve                                  $57
Partner price                                  $89
Gross margin                                   $32   (36%)
```

For Featured, add roughly $75/mo of dedicated content production (one reel, shot and edited) plus $8 of placement management — cost to serve ~$140, margin ~26%. Featured is deliberately the *thinner*-margin tier: it is a labour business, and you should want most cafes on Partner.

**Revenue at target — after the founding cohort begins converting:**

```
15 converted Founding Partners × $49                   $  735
20 Partners          × $89                   $1,780
 5 Featured          × $189                  $  945
                                              -------
MRR                                           $3,460
ARR                                           $41,520
Less reimbursements (~600 rewards × $4)      -$2,400/mo at scale
```

Reimbursement is already folded into cost-to-serve above; the line is repeated here because it is the number that moves fastest and the one to watch weekly.

#### 3.1c.1 Revenue paths that don't charge cafés **[v2.4]**

Calgary earns $0 by design (§3.0), and café subscriptions may not be the only answer afterwards. Four alternatives, assessed honestly. Each has to cover reimbursement *and* your time, which is the constraint that rules most of them out at small scale.

**1. Sell matcha directly — highest ceiling, biggest change**

You will hold flavour profiles for hundreds of Calgarians, volunteered through a 9-question quiz. That is a better DTC targeting signal than any beverage brand in Canada has. Coffee beans and ceremonial matcha both run 50–70% margin direct; a starter kit at ~$65 against a ~$28 landed cost clears more per unit than four café subscriptions. *"The app that knows your taste sells you the coffee for your taste"* is a coherent story — it is the Idle Hour model with an acquisition engine attached (§4.1).

Cost: inventory, shipping, customs, and it makes you a physical-goods business. That is a materially different company from a software one, and it should be a deliberate choice rather than a drift.

**2. Consumer subscription — revisit it**

Cut in §3.1e because a free user base is what the café plans are ultimately buying access to. The founding offer does not change that principle. $4.99/mo for **convenience, never for a better match** (§5.1): unlimited refreshes, wider radius, early access to seasonal drops, a second card per month. At 3,000 members and 5% conversion that is ~$750/mo — real, not sufficient alone, but it scales with each new city in a way café sales don't.

**3. Brand-funded campaigns — best fit for what you already have**

A matcha supplier or an oat milk brand funds a citywide *"Strawberry Matcha Week."* Cafés participate free, the brand pays. You are selling audience access to a CPG company instead of to a small business: much larger budgets, far fewer conversations, and cafés like you more because they get traffic without an invoice. Requires no new build, no inventory, and no change to the product. **Start here after the trial.**

**4. Performance commission — later stage only**

Take a cut only when you demonstrably drive an order. Requires ordering or POS integration, which this spec has deliberately avoided from the first version (§13) because it is the thing that kills café deals. Not a launch option.

**Ruled out permanently:**
- **Selling placement or ranking.** Kills §5.1 and the product with it.
- **Selling user-level taste data.** Aggregate market intelligence to a CPG brand is defensible; anything identifiable is not worth the trust it costs, and trust is the entire asset.

**Recommended sequence:** brand-funded campaigns → consumer subscription → café subscriptions in city two → own matcha, once the taste data has demonstrably predicted purchases.

#### 3.1c.2 Paying cafés, and tax **[v2.4]**

Not required during each café’s six-month Founding period, when that café contributes capped rewards; required once reimbursement switches on for a paying Partner.

| Partners | Method |
| --- | --- |
| Under ~25 | **Interac e-Transfer, monthly**, with a one-page statement PDF per café generated from `reimbursements` (§16). Manual, ~20 minutes a month, no integration. |
| Over ~25 | **Stripe Connect**, automated payouts, worth the build only at that volume |

**GST — get an accountant before the first invoice.** Once revenue crosses **$30,000 in four consecutive quarters** you must register for GST and charge 5% on subscriptions in Alberta. Two things to have answered by a professional, not guessed: whether the $4.00 reimbursement is a purchase (with input tax credits) or a rebate, and whether the trial's donated drinks create any reportable value. Cheap to ask now, expensive to fix later.

#### 3.1d The honest problem with selling marketing

**You are promising labour, not software.** "Exposure and marketing on Instagram and website" is an agency deliverable. Software scales; content production does not. Forty Partner cafes each expecting a dedicated post is forty posts a month — that is a full-time job, and it is the thing that will quietly break first.

The tiering above is the fix, and it needs to be explicit in the contract:

- **Partner tier promises inclusion, not dedication.** Group posts, roundups, map features, seasonal lists, story mentions. One well-made "5 best matcha spots in Kensington" carousel serves five cafes at once. Write the deliverable into the terms as *"inclusion in at least 2 group features per month"* — specific enough to be a promise, bounded enough to be keepable.
- **Featured tier is where dedicated content lives**, capped at one piece per month, and **cap the number of Featured slots at 8**. Not a pricing trick — a capacity limit, and saying so out loud ("we only take 8, so the feature actually gets attention") is more persuasive than pretending it's scarcity marketing.
- **Batch production.** One shooting day per week, four cafes per day, content banked a month ahead. Ad-hoc production is what kills this.

**[DECIDE]** whether you are willing to be a content producer at all. The alternative is Partner-only at $59/mo with zero dedicated content — pure platform, pure margin, fully scalable, and a materially weaker pitch to a cafe that has never heard of you. My read: run Featured for the first year because you need the case studies, then decide whether to keep it or hand it to a contractor.

#### 3.1e What happened to City Club

**Recommendation: cut it for v1.** The consumer app becomes entirely free.

Reasoning: your revenue is now B2B, and B2B revenue scales with *how many users cafes think you have*. A paywall on the consumer side directly suppresses the number you are selling. Free consumer + paid cafes is the cleaner business, it's one Stripe integration instead of two, and it removes an entire failure mode from §3.2.

The City Card, Form, and the City Club schema stay in the codebase, unused. If you later want a consumer tier, the natural shape is convenience rather than discount — unlimited match refreshes, a wider search radius, early access to seasonal drops — at $4.99/mo. Never sell a *better* match. That's §5.1.

### 3.4 Non-revenue but load-bearing

- **Founding Partner cohort.** The first 15 approved cafés receive six months of Partner benefits and defined launch extras at no fee. Their exchange is capped reward participation, current data, and operational feedback.
- **Do not sell placement.** The instant Match % can be bought, the number is worthless and so is the app. This is the one thing you should write into the product principles and never revisit.

---

## 4. Brand system

### 4.1 Direction — two surfaces, one city **[REVISED v3.0]**

#### 4.1a The two-surface rule (unchanged, and still the most useful thing here)

| Camp | References | What it is |
| --- | --- | --- |
| **Loud** | OCHAYA, OkuCha, Daily Cha, the Instagram grid | Café *brands*. Saturated colour, heavy display type, texture edge to edge. |
| **Quiet** | **Idle Hour Matcha**, summerforestbkk | A *product*. Near-white ground, generous negative space, restraint, one bold gesture. |

> **Marketing surfaces are a brand. Product surfaces are a workspace.**

- **Marketing** — landing, `/for-cafes`, Instagram, decals, the partner deck. Go loud, compete for attention.
- **Product** — quiz, Proximity Map, results, café profiles, menus, the card, the Portal. Go quiet, compete for comprehension.

This is not taste. Product screens display *data* — an 88% match, 1.2 km, $6.50, a tagged menu, a two-axis scatter plot. Saturated fields make the Proximity Map unreadable and heavy display type kills menu scanning. Every Loud reference was designed to sell one drink, not to help someone compare three cafés.

#### 4.1b What the rebrand changes

The matcha-specific signals in the old identity are now wrong, and three have to go:

| Retired | Why | Replacement |
| --- | --- | --- |
| **Matcha green as the primary** | The brand no longer belongs to one drink | **Espresso brown** primary; green demoted to one drink signal among several |
| **`まっちゃ` kana subtitle** | Signalled Japanese tea, not a Calgary café guide | Cut. No replacement — the lockup is stronger plain. |
| **Chasen (whisk) mark** | A matcha tool as the mark of a coffee-inclusive product | See below |

**New mark direction: the cup and the grid.** A circle (cup, from above) intersected by two straight lines (streets, and the Proximity Map's own axes). It reads as a cup, a city block, and a crosshair simultaneously — which is precisely the three things the product is. Single-weight line art, legible at 24px, and it is *already* the shape of your signature screen, so the mark and the map reinforce each other.

**Keep the powder blue.** `--sky` from the summerforest packaging is still the differentiator and it is now doing more work than before: green was the matcha category's colour, and you have left that category. Blue is what stops this looking like every other café brand.

**A note on the Sex and the City echo (§2.1).** Own the pun in the *name*; do not borrow the *look*. No pink script, no skyline silhouette, no title-card serif. The visual identity should read Calgary and specialty coffee, not Manhattan and 1998. This is both a legal precaution and a better design brief.

**[DECIDE]** the mark direction before any signage or decal production. Everything else in §4 survives the rebrand unchanged.

### 4.2 Colour tokens **[REWRITTEN v3.0]**

The old palette was built on `--ceremony`, a deep matcha green, as the primary. That colour *was* the category — and you have left the category. Every matcha brand in your reference set is green; almost every specialty coffee brand is brown or black. The job now is to be neither by default.

**The move: espresso brown carries the brand, powder blue carries the difference, green is demoted from identity to signal.**

```css
:root {
  /* ── PRODUCT GROUND (quiet register, §4.1a) ── */
  --ground:     #FCFBF8;  /* near-white, faintly warm — app background */
  --surface:    #FFFFFF;  /* cards, sheets, elevated things */
  --ink:        #1A1A17;  /* body text — near-black, not pure */
  --ink-2:      #6B6B63;  /* secondary text, labels, distances */
  --hairline:   #E8E5DE;  /* 1px borders — the main structural device */

  /* ── BRAND (loud register) ── */
  --espresso:   #3A2C24;  /* PRIMARY — headings, dark sections, the mark */
  --espresso-2: #241A15;  /* pressed states, full-bleed backgrounds */
  --crema:      #E3D3BC;  /* warm mid — secondary surfaces, stripes */
  --paper:      #F4EFE4;  /* warm cream — marketing base */

  /* ── SIGNAL (meaning only, never decoration) ── */
  --sky:        #C6D8E6;  /* summerforest powder blue — the differentiator */
  --sky-deep:   #6E93B0;  /* blue at text weight */
  --blush:      #E8C4C0;  /* MATCH STATES ONLY */
  --blush-deep: #B96F68;  /* blush at text weight */

  /* ── DRINK TYPES (new in v3.0) ── */
  --d-matcha:   #7A9A5B;
  --d-espresso: #6B4A32;
  --d-filter:   #B0703A;
  --d-tea:      #C2A25A;
  --d-other:    #93A0A8;

  /* ── SEMANTIC ── */
  --success:    #4F7A45;
  --warning:    #B5822F;
  --error:      #A8503F;
}
```

**Migration for the existing site:** every `--espresso` becomes `--espresso`; `--crema` becomes `--crema` where it was structural and `--d-matcha` where it was drink-related. A find-and-replace, then one pass to catch the places where green was doing a job green should no longer do.

#### Why espresso brown and not near-black

Near-black is the obvious specialty-coffee move and it's the wrong one here. Black reads as *third-wave austerity* — the register of a roaster selling one perfect thing. You are a guide recommending other people's drinks, and the tone is warm and city-ish, not severe.

`--espresso` at #3A2C24 is warm enough to sit against cream without going cold, dark enough for AA text at body size, and it works behind a photograph of any beverage — which black flattens and green actively fights.

#### The drink-type ramp is functional, not decorative

Drink type is now an award axis (§8.2b) and a menu tag (§8.2c), so it needs colour that carries meaning:

| Token | Drink | Where it appears |
| --- | --- | --- |
| `--d-matcha` | Matcha, hojicha | Menu item dots, award badges, filter chips |
| `--d-espresso` | Espresso drinks | same |
| `--d-filter` | Filter, pour-over, batch brew | same |
| `--d-tea` | Tea, chai, herbal | same |
| `--d-other` | Non-caffeinated, soda, juice | same |

**Rules:** small marks only — an 8px dot beside a menu item, a chip border, an award badge. Never a background field, never on a match card. Five colours as fields turns every screen into a paint chart.

**This ramp is why demoting green was a gain, not a loss.** Green now means *matcha specifically*, which is a real meaning. As the brand primary it meant nothing except "matcha company," which you are no longer.

#### The three rules that hold the system together

1. **Pink means match.** `--blush` appears only on match UI — the Match % ring, the "You" dot, a 100% state, a live reward. Nowhere else, ever.
2. **Blue means us.** `--sky` is the only colour not inherited from the category. Spend it on the brand's own furniture — map plates, the stripe, section dividers, the preview badge — so it accumulates recognition instead of scattering.
3. **Product screens stay 90% neutral.** `--ground`, `--surface`, `--ink`, `--hairline` should be nearly every pixel of the app. If a product screen reads as "brown," it is wrong in exactly the way it used to be wrong when it read as "green."

**Contrast:** `--ink` on `--ground` 15.8:1 · `--espresso` on `--paper` 10.9:1 · `--espresso` on `--ground` 12.1:1 · `--ink-2` on `--ground` 5.4:1 (AA body) · `--paper` on `--espresso` 10.9:1. Signal and drink colours never carry text on light grounds — use `--blush-deep` / `--sky-deep`, or keep drink colours as marks only.

Dark mode: still skipped for v1 (§0.5).

### 4.2a Photography direction **[NEW v1.8]**

Idle Hour's photography is doing more work than its layout, and it's replicable on a phone with a window.

- **High-key, single subject, generous negative space.** One cup, one bag, one grinder. Not a styled flat-lay of nine objects.
- **Soft directional daylight**, faint shadow, no hard flash, no moody dark grading.
- **Product at rest**, not hands-in-frame lifestyle. Lifestyle shots go on Instagram; the app uses calm object photography.
- **Consistent crop and ground across every cafe** — when 60 cafes are on one screen, inconsistent photography is what makes it look amateur, not the individual photos.

**Practical:** shoot one drink and one interior per cafe during your 45-minute vector-seeding visit (§13). Same phone, same time of day where possible, same edit preset. That's 120 images and it is the single biggest lever on whether the app looks real.

**Never mix in cafe-supplied photography on match screens.** Every cafe's own Instagram has a different grade and it will look like a directory. Cafe-supplied images can live on the Cafe Profile in a labelled gallery, below your own.

### 4.3 Typography

| Role | Face | Source | Usage |
| --- | --- | --- | --- |
| Display | **Fraunces** (variable — use `SOFT` 60, `WONK` 1) | Google Fonts, free | Headlines, café names, Match % |
| Body / UI | **General Sans** | Fontshare, free | Everything functional |
| Utility | **Martian Mono** | Google Fonts, free | Eyebrows, labels, timestamps, redemption codes |

**Why Fraunces:** its optical-size and softness axes let one family go from wedding-invitation romance (large, soft, wonky) to workmanlike (small, flat). That range is exactly your brand's two poles. It is also not the high-contrast serif that shows up on every AI-generated cream landing page.

**Type scale** (1.25 minor third, 16px base):

```
display-xl   56px / 1.05  Fraunces 600, SOFT 60, -0.02em
display-l    40px / 1.10  Fraunces 600, SOFT 60, -0.015em
display-m    28px / 1.20  Fraunces 500
heading      22px / 1.30  General Sans 600
body-l       18px / 1.55  General Sans 400
body         16px / 1.55  General Sans 400
body-s       14px / 1.50  General Sans 400
label        12px / 1.20  Martian Mono 500, 0.08em, uppercase
```

### 4.4 Logo and motif

- **Lockup:** "BREW AND THE CITY" set in Fraunces, with `まっちゃ` in Zen Kaku Gothic beneath at label size — same move OkuCha makes with `おくちゃ` and it's the one thing on that board worth borrowing.
- **Mark:** a circle intersected by two straight lines — a cup from above, a city block, and the Proximity Map's own axes at once (§4.1b). Drawn in `--espresso`. Single-weight line art, legible at 24px.
- **Scalloped edge** (from Daily Cha): the divider between a full-bleed marketing section and the section below it. Marketing surfaces only — it's a brand gesture, and it has no business on a results screen.
- **Signature motif:** the **candy stripe** from the summerforest packaging — alternating `--sky` / `--paper` or `--crema` / `--paper` at ~8px. Used exclusively as the edge treatment on redeemable things (the City Card, a live reward, partner offers). Striped edge = something you can spend. Again: motif as signal, not decoration.
- **Texture:** a subtle paper grain overlay on `--paper` surfaces (2–3% opacity noise). This is what sells the stationery feeling and it's one CSS layer.

### 4.5 Motion

Restrained. Three moments only:

1. **Match reveal** — the Match % ring draws from 0 to value over 700ms, `cubic-bezier(0.16, 1, 0.3, 1)`. Number counts up alongside. This is the app's one showy moment; everything else stays quiet.
2. **Card flip** — Match Card flips to the back on tap for full details, 400ms, 3D transform.
3. **reward activation** — the stripe edge animates once when a reward becomes live, then holds.

Everything else: 150ms opacity/transform, or nothing. `prefers-reduced-motion` disables all three and shows end states immediately.

---

## 5. Design principles

1. **The number is sacred.** Match % can never be influenced by money. Ever. See §5.1 — this is now the most important rule in the document, because §3.1 introduced money into the system.
2. **Pink means match.** One colour, one meaning.
3. **Explain every match.** A score with no reason is a horoscope. Every Match % ships with 1–3 plain-language reasons.
4. **Cold start must be warm.** The quiz means a brand-new user with zero friends and zero visits still gets real matches on screen 1.
5. **The metaphor is decorative, the mechanics are literal.** Cute nouns, boring verbs.

### 5.1 The paid-promotion firewall — read this before building anything ranking-related

**The tension.** Cafes now pay to be promoted (§3.1). A user's entire reason to trust this app is that the Match % is honest. Those two facts are in direct conflict, and if you resolve it carelessly you get Yelp — a product people actively distrust, whose recommendations they route around.

**The resolution: payment buys inclusion, never position.**

| Payment CAN affect | Payment CAN NEVER affect |
| --- | --- |
| Whether a cafe is in the **City Card** network | The **Match %** shown for any cafe, to anyone, ever |
| Whether a cafe enters the **Today’s Pick** pool | The **order of the top 3** in Discover or the quiz reveal |
| Whether a cafe appears in **featured rotation** slots | Whether a cafe appears on the **map** or in search |
| Whether a cafe gets **seasonal campaign** placement | Whether a cafe can **win an award** (§8.2b) |
| Whether a cafe gets **menu matching** and the 100% state | The cafe's **taste vector** or its **Elo** from real user matchups |

**Concretely, this means:**

1. **Every cafe in Calgary gets a real Match %**, paid or not. A Listed (free) cafe that is a 94% match for you shows as 94%. If you ever compute a different number for a non-paying cafe, the product is dead and you won't find out until it's too late to fix.
2. **The top 3 is never filtered by payment.** The personalized results — the core product — draw from every cafe in the database, partner or not. Non-negotiable, and it is what makes the free app worth using.
3. **Awards are computed across every cafe, partner or not** (§8.2b). A Listed cafe can win. That is deliberate: an unpaid cafe holding an award is the best sales call you will ever make.
4. **Featured slots carry a "Featured" label** in Martian Mono at label size, visually distinct from organic results, never interleaved silently into a ranked list.
5. **Ordering within the partner pool is still by merit** — aggregate Elo and match quality. Paying more never moves a cafe up. There is no ad auction. There is no premium placement tier above Partner.

**Why this is worth the revenue you leave on the table.** The moment a user suspects the number is bought, every number in the app becomes noise and the matching engine — the only thing you have that Google Maps doesn't — is worthless. The firewall is the product. Write it into the Terms, put it on the `/how-it-works` page in plain language, and make it something you say out loud to cafes during the sales conversation, because "you cannot buy a better score here" is also the reason a good cafe wants to be on this platform rather than Yelp.

**Enforcement:** the scoring module (§11.2) must not receive subscription status as an input. Pass it a user vector and a cafe vector, nothing else. Filtering by tier happens in the *query layer*, above scoring, and only for the surfaces listed in the left column above. Make this structurally impossible to violate rather than a thing you remember not to do.

---

## 6. Core user experience

### 6.1 First-run flow

**Applies to the public launch app (§12.1b), not the pre-launch site.** Nothing in this section exists during §0.4 — the pre-launch site collects a waitlist email and nothing else. This flow starts once the product itself ships.

```
Email signup (magic link) → Location permission → Flavour Quiz (8 cards)
   → PROXIMITY MAP reveal
   → TWO lists side by side:
        • "Your top matches"       (personalized, all cafés)
        • "Top ranked in Calgary"  (partner leaderboard, labelled)
   → [optional] Find friends → City Card card introduced (free, no upsell)
```

**Email-first — [DECIDED v1.3].** Signup is email + magic link, no password. Supabase Auth handles it. Rationale: magic link removes password friction on mobile, and having the email *before* the quiz means an abandoned quiz is still a recoverable lead — you can send "you were two questions from your flavour profile."

**The tradeoff, stated honestly:** v1.2 ran the quiz before signup so people saw value before a wall. Email-first will cost you some top-of-funnel. Mitigation: run the 3-question mini-quiz on the public marketing site (§12.1b) *before* signup, so the wall arrives after they've already seen a Proximity Map with their name on it. Signup then reads as "save this," not "prove yourself."

**Two lists, always.** The reveal shows personalized matches *and* the general Calgary leaderboard, side by side. New users often don't trust a personalized result until they can check it against consensus — seeing that their #1 is also the city's #3 is what makes the number credible. Seeing that their #1 is the city's #22 is *also* useful: that's the app telling them something they couldn't have found otherwise, and that's the moment the product justifies itself.

### 6.2 The daily loop

Open app → today's **Today’s Pick** card → accept (adds to City List) or pass → browse map or matches → visit a café → check in → two or three City Picks → results sharpen Your Taste → tomorrow's match is better.

The loop is legible to the user, which matters: people tolerate giving data when they can see it working. Show a small "Your Taste got sharper" confirmation after each ranking.

---

## 7. The matching engine

This is the differentiator. Everything above is packaging.

### 7.1 The taste vector

Both users and cafés are represented as a 7-dimensional vector, each dimension `0–100`.

| # | Dimension | 0 | 100 |
| --- | --- | --- | --- |
| 1 | `drink_profile` | Sweet, creamy, flavoured, dessert-adjacent | Bold, unsweetened, origin-forward, purist |
| 2 | `energy` | Silent, laptop-friendly, solo | Loud, social, busy, communal table |
| 3 | `aesthetic` | Minimal, japandi, concrete, restrained | Maximal, cosy, vintage, cluttered-charming |
| 4 | `pace` | Grab-and-go, counter service, 10 min | Linger, table service, 2+ hours |
| 5 | `adventure` | Classics done perfectly | Rotating seasonal experiments |
| 6 | `price_tolerance` | Under $5 | $9+ without flinching |
| 7 | `food_weight` | Drink only, food irrelevant | Pastry program / brunch is half the reason |

**Why 7 and not more:** each dimension needs at least one quiz question and ideally two signals. Beyond ~8 dimensions, sparsity kills you at this data volume and the added dimensions just add noise. Resist expanding this in v1.

### 7.1a Primary drink category — categorical, not a vector axis **[NEW v3.1]**

Question 1 stores `primary_drink_category` as one of:

| Value | User-facing choice | Menu bases it includes |
| --- | --- | --- |
| `coffee` | Coffee | `espresso`, `filter` |
| `matcha` | Matcha | `matcha` |
| `tea_chai` | Tea or chai | `tea`, `hojicha`, `chai` |
| `refreshers_other` | Refreshers and other drinks | `other`, `refresher`, `lemonade`, `sparkling` |

This preference sits **beside** the 7-dimensional taste vector. Do not encode “coffee versus matcha” as a point on the sweet-to-bold axis; drink category and drink style answer different questions.

Use `primary_drink_category` in three places:

1. **Availability gate:** a café must be seeded as serving the selected category to appear in the user’s ranked top three.
2. **Menu recommendation:** when a partner menu is available, named drink recommendations come from that category first.
3. **Content and filters:** category-specific drops, map filters, and café-profile menu ordering use the saved preference.

Question 2 then adapts its wording to the selected category while applying the same `drink_profile` deltas. This keeps scoring comparable across coffee, matcha, tea, and refresher drinkers.

**User vector sources:**
- Quiz answers (initial seed, weight 1.0)
- Rankings of visited cafés (each ranking nudges the user vector toward/away from that café's vector — see 7.5)
- Explicit edits (user can view and adjust Your Taste in settings — important for trust)

**Café vector sources:**
- Admin/operator seed at onboarding (you fill this in when you add a café — non-negotiable for cold start)
- Aggregate of user rankings, phased in as `n` grows
- Café owner's own submission via the portal, treated as a *prior*, not truth

### 7.2 Layer 1 — Taste Fit

Weighted Euclidean distance, normalized to 0–100.

```
dims       = [drink_profile, energy, aesthetic, pace, adventure, price_tolerance, food_weight]
weights w  = [1.3,           1.2,    1.0,       1.1,  0.8,       1.0,             0.7]

d = sqrt( Σ wᵢ · (userᵢ − caféᵢ)² )
d_max = sqrt( Σ wᵢ · 100² )

TasteFit = 100 · (1 − d / d_max)
```

This axis is deliberately **beverage-agnostic** (v3.0) — it reads the same whether someone's drink is a vanilla latte, a strawberry matcha, or a black filter coffee. The old matcha-specific poles (sweet-creamy ↔ grassy-ceremonial) forced every non-matcha drinker to translate.

`drink_profile` and `energy` carry the most weight because they're the two dimensions where a mismatch actually ruins the visit. Aesthetic mismatch is survivable; walking into a loud café for a 3-hour work session is not.

**Hard filters applied before scoring** (a café that fails any of these is excluded, not down-ranked):
- Drink availability: `cafes.drink_categories` must contain the user’s `primary_drink_category`
- Dietary: if user has a non-dairy requirement, café must have `has_oat_milk` / `has_non_dairy = true`
- Distance: outside `max_radius` (default 8km, user-adjustable)
- Closed: not open now, when `context = right_now`

### 7.3 Layer 2 — Social Proof

For café *C* and user *U*, take every friend *F* who has ranked *C*.

```
sim(U,F)   = cosine similarity of taste vectors, clamped [0,1]
rating(F,C)= weighted mean of F's three axis scores for C, normalized 0–100
             (Drink 0.4, Vibe 0.35, Chemistry 0.25)
             v1.1: axis score = F's percentile rank of C within their own
             cafe_elo for that axis, × 100. Percentile, not raw Elo — raw
             Elo isn't comparable between users with different match counts.

raw = Σ sim(U,F) · rating(F,C)  /  Σ sim(U,F)
```

**Bayesian shrinkage** toward the global mean so one friend's opinion doesn't dominate:

```
m = 3                       // prior strength, tune after launch
μ = global mean rating for C (or platform mean if C has no ratings)
n = number of friends who ranked C

SocialProof = (n · raw + m · μ) / (n + m)
```

If `n = 0`, `SocialProof = μ` and Layer 2 contributes nothing distinctive — which is correct behaviour, not a bug.

**The important design choice here:** friends are weighted by *taste similarity*, not by friendship. Your friend with terrible taste should not move your matches. This is the thing that makes the social layer actually work rather than being a popularity contest, and it's worth saying out loud in marketing.

### 7.4 Layer 3 — Context Fit

The user picks a context before browsing (or it's inferred from time of day). Each context is a set of **hard filters** plus **dimension overrides** that temporarily reshape the user vector.

| Context | Hard filters | Overrides |
| --- | --- | --- |
| **Deep work** | `has_wifi`, `has_outlets`, `seating ≥ 12` | `energy → 15`, `pace → 90` |
| **Date** | `seating_type` includes tables, `noise ≤ 60` | `aesthetic → user +20`, `pace → 80`, `price_tolerance → user +15` |
| **Quick fix** | open now, `avg_wait ≤ 8min` | `pace → 5`, `energy → user` |
| **Catch-up** | `seating ≥ 8`, `noise ≥ 40` | `energy → 75`, `pace → 70` |
| **Treat yourself** | none | `adventure → 85`, `price_tolerance → 90`, `food_weight → user +25` |
| **Just browsing** | none | none — pure Layer 1 + 2 |

`ContextFit` is computed by re-running Layer 1 with the overridden vector, so context doesn't need its own scoring function. Clean.

### 7.4a Layer 4 — Proximity **[NEW v1.7]**

Distance was previously only a hard filter: inside the radius or excluded. That is wrong for Calgary, where the difference between 800m and 9km is the difference between a habit and a special occasion. Distance is now a **scored term**.

```
d = haversine(user_location, cafe) in km

ProximityFit = 100                                if d ≤ 1.0
             = 100 · exp( -(d - 1.0) / τ )        if d > 1.0

τ = 5.0   summer (Apr–Oct)
τ = 3.0   winter (Nov–Mar)     ← the season_distance_multiplier from §1.5
```

Summer: 2km → 82, 5km → 45, 10km → 17.
Winter: 2km → 72, 5km → 26, 10km → 5.

**Which location.** Priority order: live GPS if permitted → the neighbourhood the user last searched → their stated home area from onboarding. Always show which one is in use as a tappable chip: *"Near **Beltline**"*. Never guess silently — a user who doesn't know where the app thinks they are will not trust the results.

**The plateau matters.** Everything within 1km scores identically, so among genuinely walkable options taste and need decide, not metres. Without the plateau the app becomes a proximity ranker, which is Google Maps' job and it does it better.

**The guard — "worth the trip."** A pure distance term will bury excellent distant cafes. So: if a cafe scores ≥ 88 on `ContextFit` and `TasteFit` alone but falls out of the top 3 on proximity, surface it separately below the main results, labelled **"Worth the drive — 22 min."** One per result set, never more. This preserves discovery, which is the entire point of the product, while keeping the default answer practical.

**Never let proximity break a tie** in favour of a partner cafe. Ties break on `ContextFit`, then raw distance (§5.1).

### 7.5 Combining the layers — needs first, then distance **[REWEIGHTED v1.7]**

```
Match% = round( wC·ContextFit + wT·TasteFit + wP·ProximityFit + wS·SocialProof )
```

**Context leads, proximity is permanent.** From the clearest statement of the product's purpose so far:

> Cafe A and Cafe B have similar taste profiles. The consumer needs somewhere to study. We match them with Cafe B.

Taste tells you which cafes a person *could* love. Need tells you which is right this afternoon. Distance tells you which they will actually go to.

| User state | wC (need) | wT (taste) | wP (distance) | wS (social) |
| --- | --- | --- | --- | --- |
| Quiz only, no friends, no history | 0.35 | 0.40 | 0.25 | 0.00 |
| < 5 matchups, no friends | 0.38 | 0.37 | 0.25 | 0.00 |
| < 5 matchups, has friends | 0.38 | 0.30 | 0.22 | 0.10 |
| 5–20 matchups, has friends | 0.37 | 0.26 | 0.20 | 0.17 |
| 20+ matchups, 5+ friends | 0.35 | 0.25 | 0.20 | 0.20 |

Weights sum to 1.0. `wC` never drops below 0.35 and `wP` never below 0.20 — knowing someone's taste perfectly does not change the fact that they need an outlet right now and will not drive 40 minutes for it.

**When no context is selected**, infer it rather than falling back to taste alone:

| Signal | Inferred context |
| --- | --- |
| Weekday 9am–11am | Quick fix |
| Weekday 1pm–5pm | Deep work |
| Weekday after 5pm, weekend afternoon | Catch-up |
| Weekend morning | Treat yourself |
| Explicitly set by user | Always wins |

Show it as a visible, tappable chip — *"Assuming: **deep work**"* — never as a silent decision. The tap that corrects it is a strong signal worth logging.

**Display rules** (unchanged): floor 40, ceiling 98, and 100% reserved for the menu-item match defined in §8.2c.

**Tie-break for implementers.** Within 3 points, break on `ContextFit`, then raw distance. Never on partner tier (§5.1).

### 7.6 Feedback loop — how rankings update Your Taste

After a user ranks café *C*:

```
r     = normalized rating 0–100 (percentile-based, same axis weighting as 7.3)
pull  = (r − 50) / 50          // −1 … +1
α     = 0.08                    // learning rate — deliberately slow

for each dimension i:
    userᵢ += α · pull · (caféᵢ − userᵢ)
    userᵢ  = clamp(userᵢ, 0, 100)
```

A loved café pulls your vector toward it; a disliked one pushes away. `α = 0.08` means roughly 12 rankings to meaningfully move a dimension — slow on purpose, because fast-adapting profiles feel unstable and users notice.

**Guard:** never let the vector update run on a matchup submitted within 60s of the receipt being approved (rage-ranking / accidental taps).

**v1.1 timing:** because a matchup changes the Elo of *both* cafes, recompute the user vector on a debounce — once per session, not once per comparison. Otherwise a six-comparison placement run moves the vector six times.

### 7.7 Match explanations

Every Match % ships with 1–3 reasons, generated by inspecting which term contributed most:

```
Template rules (pick top 3 by contribution):
  TasteFit, dim with smallest |user − café| and high weight
    → "Matches your taste for {dim_label}"
  SocialProof, n ≥ 1
    → "{friend_name} ranked this #{rank} for The Space"
  SocialProof, n ≥ 3
    → "{n} friends with taste like yours rate this highly"
  ContextFit active
    → "Good for {context_label} — {specific_filter_passed}"
  Novelty flag
    → "Nothing else in your Regulars is like this"
```

Keep these plain. "Matches your taste for quiet spaces" beats "94th percentile energy alignment."

### 7.8 Anti-patterns to avoid

- **No filter bubble — but not inside the top 3.** Earlier drafts injected a 55–70 scoring wildcard into every match set. With only three results shown (§8.2), that would spend a third of the answer on a deliberate miss. Instead the wildcard is a **labelled fourth slot** below the ranked three: *"A bit different from your usual."* Same slot pattern as "worth the drive" (§7.4a) — never both in one result set; if both qualify, "worth the drive" wins. Recommender systems that only confirm collapse into boredom, but the fix belongs beside the answer, not inside it.
- **No paid boosting.** See §5.1.
- **No engagement optimization.** Do not tune weights toward session length. Tune toward *visit rate* — did the person actually go. That's the only metric that means the product worked.

---

## 8. Feature specification

### 8.1 Today’s Pick
Single card, served once per day at **[ASSUMED]** 7:00am local. Highest-scoring café the user hasn't visited or dismissed. Accept → City List. Pass → suppressed 90 days, and the pass is *not* used as a negative training signal (too noisy — people pass because they're busy).

### 8.2 Discover
**Top 3 at a time — not an infinite feed.** Context selector pinned at top, three ranked cafes below, then "Show me three more." Same reasoning as the quiz reveal: three is a decision, ten is a search results page.

#1 gets the full card (menu item, price, three reasons); #2 and #3 are compact. A "worth the drive" entry may appear below the three (§7.4a). Free tier: 3 refreshes/day, then a soft wall.

### 8.2a The Proximity Map — signature element

**This is the thing people screenshot.** The quiz's payoff isn't a list, it's a picture of where you sit in taste-space with cafes plotted around you.

The 7-dimension vector is projected onto two fixed display axes:

```
x-axis  DRINK        sweet & creamy ──────────► bold & unsweetened
        = drink_profile, with adventure at 0.3 weight

y-axis  ROOM         quiet & lingering ────────► loud & quick
        = 0.6·energy + 0.4·(100 − pace)
```

Fixed axes, not PCA. PCA would rotate the map as the dataset grows, and a map whose meaning changes is not a map. These two axes carry the most weight in the match score (§7.2) and are the two dimensions a person can actually feel.

```
        bold & unsweetened
                 │
                 │    ○ Monogram
     quiet ──────┼────────── loud
                 │  ● YOU
        ○ Rosso  │     ○ Sought x Found
                 │
          sweet & creamy
```

**Rendering rules:**
- User is a filled `--blush` dot at their coordinates, always labelled "You"
- Cafes are `--crema` outlined circles; radius scales with Match %
- Cafes above 85% get a thin `--blush` ring — the pink-means-match rule from §4.2
- The 8 nearest cafes are labelled; the rest are unlabelled dots until tapped
- Axis labels are always visible in Martian Mono at label size. The map is worthless if you have to guess what the axes mean.
- Tapping a dot opens the Cafe Profile
- **The distance IS the compatibility.** Do not draw connecting lines, halos, or gradient fields. The single visual metaphor — close means compatible — is the whole point, and any additional decoration weakens it.

**Where it appears:** quiz result screen (the reveal), the public marketing site hero (§12.1b — not the pre-launch site, which has no matching engine to draw this from, §12.1a), Your Taste screen (with a "how you've moved" trail of your last 5 positions), and as a shareable 1080×1080 PNG generated server-side via Satori — `@vercel/og` at `/api/og/proximity/[user]`.

**Motion:** cafes fade in staggered by distance, nearest first, 40ms apart, ~600ms total. This is the second of the three sanctioned motion moments (§4.5) — it replaces the Match % ring draw on the quiz result screen specifically, since the two together would be too much.

**Accessibility:** the map is decorative-plus. Every cafe on it must also appear in an ordered text list below it with Match % and reasons. Screen reader users get the list; the map is `aria-hidden`.

### 8.2b Awards, not a leaderboard **[REWRITTEN v1.5]**

**The single Top Ranked list is cut.** Two reasons, and the second matters more:

1. **It contradicts the product.** The whole thesis is that ranking cafes is the wrong frame — two people can both be right that a cafe is a 5 and a 2. A city-wide ordered list reintroduces exactly the thing you're differentiating against.
2. **It churns the partners who need you most.** A cafe paying $89/mo to sit at #38 will cancel, and they'd be right to. One big list means most of your paying customers are publicly losing.

**Replace it with many small, specific awards.** Nearly every cafe is genuinely first at *something*, and finding out what is the interesting part.

**Award axes** — the cross-product of these generates hundreds of legitimate titles:

```
DIMENSION      The Drink · The Space · The Return
DRINK TYPE     Matcha · Espresso · Filter · Tea · Non-caffeinated
CONTEXT        Deep work · Date · Quick fix · Catch-up · Treat yourself
NEIGHBOURHOOD  Beltline · 17th Ave · Kensington · Inglewood ·
               Bridgeland · Downtown
QUALIFIER      Under $6 · Open late · Open early · New this year
```

Examples: *#1 for Deep Work in Kensington*. *Best Matcha under $6 in the Beltline*. *Best Espresso in Inglewood*. *Best New Partner, 2026*.

**Drink type is now an award axis (v3.0)**, which is the rebrand paying for itself: one city, five drink categories, six neighbourhoods and three dimensions generates far more legitimate titles than a matcha-only set could — and a café that will never win on matcha can still win on filter.

**Eligibility rules — these keep it honest:**
- Minimum **20 matchups** on the relevant axis before a cafe can hold any award
- Minimum **3 eligible cafes** in a category, or the category doesn't exist. No "best cafe in Bridgeland" when there are two.
- Awards are computed across **all cafes, partner or not** (§5.1). A Listed cafe can win. That's a sales call, not a problem — it's the best cold-open you'll ever have: *"you're #1 for Vibe in Inglewood and you're not on our partner page."*
- Recomputed **weekly**, Sundays at midnight. Show the date and movement arrows. A ranking that reshuffles hourly is a stock ticker and cafes will complain about it constantly.

**Aggregate formula** (shrunk win rate — per-user Elo is private and not comparable across users):

```
wins  = matchups where cafe C won, all users, axis A, category filter applied
total = matchups involving C under the same filter
μ     = 0.5 by definition
m     = 25                        // prior strength

score = (wins + m·μ) / (total + m)
```

`m = 25` means three lucky wins don't take a title.

**The Matchup Awards — annual, and your best press asset.**

Once a year, publish the full set. *"Calgary's Best Matcha, decided by 4,000 head-to-head City Picks by 800 locals"* is a story Avenue Calgary, CBC Calgary, and the Calgary Herald will actually run — because it has a real methodology instead of being another editor's list. Publish the methodology page alongside it; that's the part that makes it credible and the part that makes it quotable.

**Physical window decals for every winner.** Screen-printed, dated, category-specific. Cost: a few dollars each. Every decal is a permanent ad in a window you didn't pay for, in the exact location where a passerby is deciding whether to walk in. Send them to Listed winners too — a free decal in a non-partner window is a sales conversation that starts itself.

### 8.2c Menu matching — the 100% match **[NEW v1.5]**

**The upgrade:** stop recommending cafes, start recommending *drinks*.

Partner cafes submit their menu monthly through the Portal. Every item is tagged from a controlled vocabulary. Matching then runs at the item level, and the recommendation becomes concrete:

> **Kissa Nishi — 100% match**
> Order the **Strawberry Ceremonial Latte**, $6.75.
> Sweet, fruity, oat by default. Quiet room, outlets at every table.

That is a fundamentally better output than "you'd probably like Kissa Nishi." It's actionable, it removes the decision paralysis of standing at a counter reading a board, and it converts a recommendation into an order.

#### What "100%" means — define it before you build it

**100% is not a rounding of 97%. It is a distinct state with a hard definition:**

> A cafe is a 100% match when it passes every hard filter for the current context AND its menu contains at least one item whose flavour tags match the user's profile on every dimension the user has expressed.

If there is no such item, the cafe caps at 96% no matter how well it scores. The number then means something specific and checkable: *we found your drink here*. Users will notice the difference and it's the difference between a score and a promise.

Show the qualifying item by name whenever a match is 100%. A 100% match with no named drink is just a number, and an unexplained 100% is the least believable number in the app.

#### Menu schema and tagging

Cafes tag their own items in the Portal from a **controlled vocabulary** — checkboxes, not free text. This is the only way it scales, and it takes an owner about 10 minutes a month.

```
FLAVOUR      sweet · grassy · umami · fruity · floral · nutty ·
             chocolate · spiced · citrus · vanilla · earthy
STRENGTH     mild · balanced · strong · ceremonial
BASE         matcha · hojicha · espresso · filter · tea · other
MILK         dairy · oat · almond · soy · none · oat-by-default
TEMP         hot · iced · both
SWEETNESS    unsweetened · lightly · sweet · dessert
DIETARY      vegan · gluten-free · caffeine-free
FLAGS        seasonal · signature · limited
```

**Monthly submission is a Partner-tier requirement**, and it's a feature for the cafe as much as an obligation: seasonal items get surfaced to exactly the people whose profile matches them, the month they launch. Frame it that way in onboarding.

**Enforcement, gently.** A menu older than 45 days shows a small "menu may be out of date" note on the profile and drops the cafe out of the 100% eligible pool — it stays fully matchable, just capped at 96%. Portal nudge at 30 days, email at 40. Never delist a cafe over a stale menu; that punishes the customer for the cafe's admin.

**[DECIDE]** who tags for Listed (free) cafes. Recommendation: nobody — menu matching is a Partner benefit, and it's the single most persuasive line on the pricing page.

### 8.2d "Not it" — the refinement loop **[NEW v1.5]**

A recommendation the user rejects is the most information-dense event in the app, and the spec previously threw it away.

Every match card carries a quiet **"Not it"** action. Tapping it asks one question — never more:

```
┌────────────────────────────────┐
│  What's off about it?              │
│                                    │
│  [ Too far ]      [ Wrong vibe ]   │
│  [ Menu's not for me ]             │
│  [ Too expensive ]                 │
│  [ Already been ]                  │
└────────────────────────────────┘
```

Each answer triggers **exactly one** targeted follow-up, then immediately re-recommends:

| Reason | Follow-up | Effect |
| --- | --- | --- |
| **Too far** | "How far will you go?" — the four Q9 options | Overrides `max_radius_m` for this session; persists if chosen twice |
| **Wrong vibe** | "What are you actually after?" — the six context chips | Overrides inferred context. **Highest-value answer in the set** — it means the need inference was wrong, which is the thing §7.5 says matters most |
| **Menu's not for me** | "What sounded wrong?" — too sweet / too bitter / nothing caught my eye / no oat milk | Adjusts `drink_profile` by ±15 for the session; the dietary answer becomes a permanent hard filter |
| **Too expensive** | "What's your ceiling today?" — under $6 / under $8 / doesn't matter | Session price filter |
| **Already been** | none — re-recommend instantly | Dismiss 90 days; if they've ranked it, no learning signal (they already told you) |

**Rules that keep this from becoming an interrogation:**
- **One follow-up, then a result.** Never chain two questions. If the second recommendation also gets rejected, show a filter sheet instead and let them drive.
- **Session-scoped by default.** A rejection tunes *this* search. It only edits the stored profile after the same reason fires three times, and then it tells the user: *"Updated Your Taste — you keep saying too sweet."*
- **"Wrong vibe" is a context miss, not a taste miss.** Do not move the taste vector on it. This distinction is the difference between an app that learns and one that slowly corrupts its own profile.
- **Log everything.** `rejections` is your best product-quality dataset. Rejection rate by reason, by context, and by cafe tells you exactly where the engine is weak — and a cafe with an abnormally high "wrong vibe" rate has a mis-seeded vector that you should go fix in person.

### 8.3 Map
Mapbox GL. Pins coloured by Match % band: `--blush` (85+), `--crema` (70–84), `--sky` (55–69), outline-only (below 55 / unscored). Partner Cafés carry a small striped edge on the pin. Clusters at low zoom.

### 8.4 City List
Saved-to-try. Sortable by Match %, distance, recently added. Swipe to remove. When a user checks in at a City List café, it auto-migrates to Regulars with a small celebratory moment.

### 8.5 Regulars
Visited cafés with visit counts. Sorted by count desc. This is the user's collection and the emotional core of retention — treat it like a Letterboxd diary, not a log file.

### 8.6 City Picks — head-to-head ranking

**Changed in v1.1.** The original spec used three 1–5 sliders. Head-to-head comparison is a better mechanic because it asks for a clear preference instead of an inconsistent absolute rating.

After a verified check-in, instead of asking for absolute scores, the app asks a head-to-head question:

```
┌──────────────────────────────────┐
│   Which had the better drink?       │
│                                      │
│  ┌───────────┐    vs    ┌───────────┐ │
│  │ Kissa     │          │ Lowtide   │ │
│  │ Nishi     │          │ Coffee    │ │
│  │ just now  │          │ your #3   │ │
│  └───────────┘          └───────────┘ │
│                                      │
│          [ too close to call ]        │
└──────────────────────────────────┘
```

Two to three comparisons per check-in, one per axis, against cafes already in the user's Regulars near the new cafe's provisional position.

**Why this beats sliders:**

- **Absolute ratings drift and compress.** Everyone's 4-star means something different, and the same user's 4-star in March means something different by August. Comparisons are stable — "I preferred A to B" doesn't drift.
- **It produces a true ordinal ranking**, which is what "your #1 for The Space" actually requires. Sliders produce ties you then have to break arbitrarily.
- **It's faster.** Two taps versus three slider drags.
- **It generates better training data** for the taste vector (§7.6), because a preference between two known cafes is a much sharper signal than a lone 4/5.
- **It improves the guide.** Each City Pick sharpens the user’s personal order and makes future recommendations more trustworthy.

**Implementation — Elo per axis.** Each user holds a private Elo rating per cafe per axis, starting at 1500.

```
expected_A = 1 / (1 + 10^((rating_B − rating_A) / 400))
rating_A' = rating_A + K · (result_A − expected_A)

K = 32 for a cafe's first 5 matchups, 16 thereafter
result: win 1.0, "too close to call" 0.5, loss 0.0
```

Displayed rank per axis = Elo order. Display a 1–5 star equivalent derived from percentile *only* on the public cafe profile, so the aggregate stays legible to newcomers — the user themselves always sees their ordered list, never a star.

**Comparison selection:** binary-search style. Pick the opponent nearest the new cafe's current estimated position, so each comparison carries maximum information. Ordering ~40 cafes takes roughly log₂(40) ≈ 6 comparisons, not 40.

**Cold start:** the user's first cafe in an axis has nothing to compare against. Ask for a single one-time absolute placement ("great / fine / not for me"), seed Elo at 1650 / 1500 / 1350, then never ask absolutely again.

**Schema change:** `rankings` is replaced by `matchups` and `cafe_elo`. See §10.

City Picks are only available after a **verified visit** — which since v1.5 means an approved receipt (§3.1f), not a geofence. A receipt proves a purchase; standing near a café proves nothing, and only a purchase should earn the right to rank.

**Consequence for v1:** matchups are deferred (§0.5), so geofenced check-in is not needed at launch at all. `check_ins` stays in the schema for later, but nothing in v1 writes to it. Do not build the geofence in v1 — it is a permissions prompt and a battery cost buying nothing.

### 8.7 Check-in — **deferred out of v1 [v1.9]**

Superseded as proof-of-visit by receipt upload (§3.1f). A geofence proves presence; a receipt proves a purchase, and only a purchase should earn a stamp or the right to rank.

Retained in the schema for a later version, where an optional check-in could add a lightweight "I'm here" social signal. Not v1: it costs a location permission prompt at the worst possible moment and buys nothing the receipt doesn't already give you.

### 8.8 Friends & the feed
Bidirectional follow (request/accept), because taste data is personal. Feed shows: check-ins, rankings, photos, and shared café recommendations. **Reverse-chronological only, no algorithmic feed** — the algorithm lives in matching, not in the feed, and mixing the two makes both feel manipulative.

### 8.9 Send This Spot
Send a Café Profile to a friend with an optional note. The recipient sees the café with *their own* Match % attached, not the sender’s. The feature is sharing, not scheduling, social matching, or meetups.

### 8.10 The City Card
Five slots, filled left to right. Each filled slot shows the cafe that earned it.

Below the card, the part that does the work: **nearby partners you haven't stamped yet, ordered by Match %**. That list turns a loyalty card into a discovery surface and is what sends members somewhere they wouldn't have picked.

If a cafe already has 2 stamps on the current card (§3.1a.1), its profile shows *"You've stamped here twice on this card — try somewhere new for your next one"* with two nearby matches. Plain, not scolding.

Free for every member. No subscription, no upsell screen.

### 8.11 Reward redemption
- At 5 stamps, the member opens a participating café with an active monthly reward list → “Choose your free item”
- Activating generates a **live QR + 4-character fallback code**, valid 10 minutes, with a visible countdown
- Café staff scans in the Café Portal (or types the code)
- Redemption recorded; that café locks out for the member until next billing period
- Offline fallback: the code validates server-side at the café's end, so member connectivity isn't required after generation

**Anti-fraud:** QR payload is a signed JWT containing `card_id`, `user_id`, `nonce`, `exp`. Server validates signature, expiry, nonce single-use, and that the redeeming café matches `cafe_id`. Screenshots are useless because of `exp` and the nonce.

### 8.12 Form — **CUT [v1.9]**

Form was an activity score that unlocked a bonus reward inside City Club. City Club is cut (§3.1e) and there is no consumer subscription to attach it to, so Form has nothing to unlock.

**Do not build it.** `form_events` stays in the schema, unused, in case a consumer tier ever returns. Rewarding app activity with free items would also invert the program's logic — the City Card pays for *visits to cafes*, not for time spent in an app.

---

## 9. Metrics

**North star: Match-to-visit conversion.** Of cafés shown at 80%+ match, what share does the user check into within 30 days? Everything else is secondary.

| Tier | Metric | Target v1 |
| --- | --- | --- |
| North star | Match→visit @ 80%+ (30d) | 25% |
| Activation | Completes quiz | 70% of installs |
| Activation | First check-in within 7d | 35% |
| Engagement | City Picks completed per active user per month | 12+ |
| Social | Has ≥1 friend by day 30 | 40% |
| Trial | Founding agreements signed / cafés onboarded | ≥ 80% (12 of 15) |
| Revenue | Partner → Featured upgrade | 15–20% |
| Program | Members holding ≥1 stamp | 50% of actives |
| Program | Stamp cards completed per month | grows monotonically — if flat, the network is too small |
| Cost | Reimbursement as % of MRR (post-trial only) | ≤ 35% |
| Revenue | reward redemption rate | 55–75% (below 50% = members feel they're wasting money; above 85% = margin problem) |
| Retention | D30 | 25% |
| Quality | Median rating of matched-and-visited cafés | ≥ 4.0/5 on Chemistry |
| Partner health | Cap utilization per partner | 40–80% (under 40% = they're not seeing value; at 100% = raise the cap or they'll feel squeezed) |
| Partner health | Attach rate on reward redemptions | ≥ 45% — this is the number that renews partners |
| Partner health | Founding Partner retention at 6 months | ≥ 80% |

That last one is the honest test of whether the algorithm works.

---

## 10. Data model

Postgres via Supabase. Row-level security on everything.

```sql
-- ============ USERS ============
users (
  id                uuid pk,
  handle            text unique not null,
  display_name      text not null,
  avatar_url        text,
  primary_drink_category text not null check (primary_drink_category in ('coffee','matcha','tea_chai','refreshers_other')),
  home_lat          numeric,
  home_lng          numeric,
  max_radius_m      int default 12000,   -- Calgary is a car city; set by quiz Q9
  worth_the_trip    boolean default false,
  created_at        timestamptz default now()
);

taste_profiles (
  user_id           uuid pk references users,
  drink_profile     smallint not null check (between 0 and 100),
  energy            smallint not null,
  aesthetic         smallint not null,
  pace              smallint not null,
  adventure         smallint not null,
  price_tolerance   smallint not null,
  food_weight       smallint not null,
  source            text default 'quiz',   -- quiz | learned | manual
  ranking_count     int default 0,
  updated_at        timestamptz default now()
);

user_requirements (
  user_id           uuid pk references users,
  needs_non_dairy   boolean default false,
  needs_gluten_free boolean default false,
  needs_wheelchair  boolean default false
);

-- ============ CAFÉS ============
cafes (
  id                uuid pk,
  name              text not null,
  slug              text unique not null,
  address           text not null,
  lat               numeric not null,
  lng               numeric not null,
  neighbourhood     text,
  phone             text,
  website           text,
  instagram         text,
  drink_categories  text[] not null, -- coffee | matcha | tea_chai | refreshers_other
  hours             jsonb,          -- [{day:0-6, open:"07:00", close:"17:00"}]
  price_band        smallint,       -- 1..4
  photos            text[],
  is_active         boolean default true,
  created_at        timestamptz default now()
);

cafe_vectors (
  cafe_id           uuid pk references cafes,
  drink_profile     smallint not null,
  energy            smallint not null,
  aesthetic         smallint not null,
  pace              smallint not null,
  adventure         smallint not null,
  price_tolerance   smallint not null,
  food_weight       smallint not null,
  seed_source       text default 'admin',  -- admin | owner | aggregate
  confidence        numeric default 0.5,   -- 0..1, rises with ranking volume
  updated_at        timestamptz default now()
);

cafe_attributes (
  cafe_id           uuid pk references cafes,
  has_wifi          boolean,
  has_outlets       boolean,
  seating_count     smallint,
  has_outdoor       boolean,
  noise_level       smallint,     -- 0..100
  avg_wait_minutes  smallint,
  has_non_dairy     boolean,
  has_oat_milk      boolean,
  has_gluten_free   boolean,
  wheelchair_access boolean,
  has_food_program  boolean,
  takes_cash        boolean
);

-- ============ PARTNERSHIP ============
partner_cafes (
  cafe_id             uuid pk references cafes,
  tier                text default 'partner',  -- founding | partner | featured
  status              text default 'pending',  -- pending | active | paused | ended
  stamps_enabled      boolean default true,
  rewards_opt_in      boolean default false,
  default_monthly_cap int default 10,
  onboarded_at        timestamptz,
  portal_pin          text                     -- staff PIN for the portal
);

partner_reward_menus (
  id                  uuid pk,
  cafe_id             uuid references partner_cafes(cafe_id),
  active_month        date not null,            -- store first day of calendar month
  status              text default 'draft',    -- draft | submitted | approved | active | paused | expired
  monthly_cap         int not null default 10,
  valid_windows       jsonb not null default '[]',
  repeat_next_month   boolean default false,
  submitted_at        timestamptz,
  approved_at         timestamptz,
  unique (cafe_id, active_month)
);

partner_reward_items (
  id                    uuid pk,
  reward_menu_id        uuid references partner_reward_menus,
  name                  text not null,
  category              text not null,          -- beverage | pastry | food | special
  description           text,
  regular_price_cents   int,
  reimbursement_cents   int,                    -- null during contributed Founding period
  size_or_portion       text,
  included_options      text[],
  excluded_upgrades     text[],
  item_quantity_cap     int,
  image_url             text,
  is_available          boolean default true,
  sort_order            smallint default 0
);

-- ============ ACTIVITY ============
check_ins (
  id            uuid pk,
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  lat           numeric, lng numeric,   -- verification
  verified      boolean default false,
  photo_url     text,
  created_at    timestamptz default now()
);

-- v1.1: head-to-head replaces absolute ratings
matchups (
  id            uuid pk,
  user_id       uuid references users,
  axis          text not null,        -- matcha | vibe | chemistry
  cafe_a        uuid references cafes,
  cafe_b        uuid references cafes,
  winner        uuid,                 -- null = too close to call
  created_at    timestamptz default now()
);

cafe_elo (
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  axis          text not null,
  rating        numeric default 1500,
  n_matchups    int default 0,
  updated_at    timestamptz default now(),
  primary key (user_id, cafe_id, axis)
);

cafe_notes (
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  note          text,
  updated_at    timestamptz default now(),
  primary key (user_id, cafe_id)
);

on_deck (
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  source        text,   -- match_of_day | discover | map | setup | search
  added_at      timestamptz default now(),
  primary key (user_id, cafe_id)
);

dismissals (
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  expires_at    timestamptz not null,
  primary key (user_id, cafe_id)
);

friendships (
  requester_id  uuid references users,
  addressee_id  uuid references users,
  status        text default 'pending',  -- pending | accepted | blocked
  created_at    timestamptz default now(),
  primary key (requester_id, addressee_id)
);

setups (
  id            uuid pk,
  from_user_id  uuid references users,
  to_user_id    uuid references users,
  cafe_id       uuid references cafes,
  note          text,
  created_at    timestamptz default now()
);

-- ============ CAFE SUBSCRIPTIONS (v1.3) ============
cafe_subscriptions (
  cafe_id            uuid pk references cafes,
  tier               text not null default 'listed',  -- listed | partner | founding
  status             text not null default 'active',  -- active | past_due | canceled
  stripe_customer_id text,
  stripe_sub_id      text,
  monthly_cents      int not null default 0,
  started_at         timestamptz,
  renews_at          timestamptz
);
-- Tier gates ELIGIBILITY for promotional surfaces only.
-- It is NEVER an input to match scoring. See section 5.1.

-- ============ MENUS + STAMPS (v1.5) ============
cafe_menus (
  id            uuid pk,
  cafe_id       uuid references cafes,
  effective_at  timestamptz not null,
  submitted_at  timestamptz default now(),
  is_current    boolean default true
);

menu_items (
  id            uuid pk,
  menu_id       uuid references cafe_menus,
  name          text not null,
  price_cents   int,
  base          text,            -- matcha | hojicha | espresso | filter | tea | other
  flavour_tags  text[],          -- controlled vocabulary, see 8.2c
  strength      text,
  sweetness     text,
  milk_default  text,
  temp          text,            -- hot | iced | both
  dietary_tags  text[],
  flags         text[],          -- seasonal | signature | limited
  is_available  boolean default true
);

receipts (
  id             uuid pk,
  user_id        uuid references users,
  cafe_id        uuid references cafes,
  image_url      text,               -- purged 30 days after resolution
  ocr_merchant   text,
  ocr_datetime   timestamptz,
  ocr_total_cents int,
  ocr_items      jsonb,
  dedupe_hash    text unique not null,
  status         text default 'pending', -- pending | auto_approved | cafe_approved | rejected | disputed
  auto_checks    jsonb,               -- which checks passed, for debugging
  resolved_at    timestamptz,
  created_at     timestamptz default now()
);

stamp_cards (
  id            uuid pk,
  user_id       uuid references users,
  card_number   smallint not null,      -- nth card this member has filled
  status        text default 'active',  -- active | redeemed | expired
  opened_at     timestamptz default now(),
  redeemed_at   timestamptz,
  redeemed_cafe uuid references cafes
);

stamps (
  id            uuid pk,
  card_id       uuid references stamp_cards,
  cafe_id       uuid references cafes,
  receipt_id    uuid references receipts unique,
  position      smallint not null check (between 1 and 5),
  created_at    timestamptz default now(),
  unique (card_id, position)
);
-- v2.0: repeats allowed. The "max 2 per cafe per card" rule (3.1a.1)
-- is enforced in the stamp-granting path, not by a unique index,
-- so the cap is tunable without a migration.

reimbursements (
  id            uuid pk,
  cafe_id       uuid references cafes,
  card_id       uuid references stamp_cards,
  reward_item_id uuid references partner_reward_items,
  amount_cents  int not null default 400,
  period        date not null,        -- month being settled
  status        text default 'accrued', -- accrued | paid
  paid_at       timestamptz
);

rejections (
  id            uuid pk,
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  reason        text not null,       -- too_far | wrong_vibe | menu | price | been_there
  followup      text,                -- the answer to the one follow-up question
  context       text,                -- what context was active
  match_pct     smallint,
  created_at    timestamptz default now()
);

awards (
  id            uuid pk,
  cafe_id       uuid references cafes,
  axis          text not null,
  context       text,
  neighbourhood text,
  qualifier     text,
  rank          smallint not null,
  period        date not null,       -- week computed
  matchup_count int not null
);

-- ============ SAFETY (v1.3) ============
blocks (
  blocker_id    uuid references users,
  blocked_id    uuid references users,
  created_at    timestamptz default now(),
  primary key (blocker_id, blocked_id)
);
-- Bidirectional in effect: filter both directions on every read.

reports (
  id            uuid pk,
  reporter_id   uuid references users,
  subject_type  text not null,   -- user | photo | note
  subject_id    uuid not null,
  reason        text not null,
  detail        text,
  status        text default 'open',  -- open | actioned | dismissed
  created_at    timestamptz default now(),
  resolved_at   timestamptz,
  resolved_by   text
);

-- ============ MEMBERSHIP ============
-- ============ MENUS + STAMPS (v1.5) ============
cafe_menus (
  id            uuid pk,
  cafe_id       uuid references cafes,
  effective_at  timestamptz not null,
  submitted_at  timestamptz default now(),
  is_current    boolean default true
);

menu_items (
  id            uuid pk,
  menu_id       uuid references cafe_menus,
  name          text not null,
  price_cents   int,
  base          text,            -- matcha | hojicha | espresso | filter | tea | other
  flavour_tags  text[],          -- controlled vocabulary, see 8.2c
  strength      text,
  sweetness     text,
  milk_default  text,
  temp          text,            -- hot | iced | both
  dietary_tags  text[],
  flags         text[],          -- seasonal | signature | limited
  is_available  boolean default true
);

receipts (
  id             uuid pk,
  user_id        uuid references users,
  cafe_id        uuid references cafes,
  image_url      text,               -- purged 30 days after resolution
  ocr_merchant   text,
  ocr_datetime   timestamptz,
  ocr_total_cents int,
  ocr_items      jsonb,
  dedupe_hash    text unique not null,
  status         text default 'pending', -- pending | auto_approved | cafe_approved | rejected | disputed
  auto_checks    jsonb,               -- which checks passed, for debugging
  resolved_at    timestamptz,
  created_at     timestamptz default now()
);

stamp_cards (
  id            uuid pk,
  user_id       uuid references users,
  card_number   smallint not null,      -- nth card this member has filled
  status        text default 'active',  -- active | redeemed | expired
  opened_at     timestamptz default now(),
  redeemed_at   timestamptz,
  redeemed_cafe uuid references cafes
);

stamps (
  id            uuid pk,
  card_id       uuid references stamp_cards,
  cafe_id       uuid references cafes,
  receipt_id    uuid references receipts unique,
  position      smallint not null check (between 1 and 5),
  created_at    timestamptz default now(),
  unique (card_id, position)
);
-- v2.0: repeats allowed. The "max 2 per cafe per card" rule (3.1a.1)
-- is enforced in the stamp-granting path, not by a unique index,
-- so the cap is tunable without a migration.

reimbursements (
  id            uuid pk,
  cafe_id       uuid references cafes,
  card_id       uuid references stamp_cards,
  reward_item_id uuid references partner_reward_items,
  amount_cents  int not null default 400,
  period        date not null,        -- month being settled
  status        text default 'accrued', -- accrued | paid
  paid_at       timestamptz
);

rejections (
  id            uuid pk,
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  reason        text not null,       -- too_far | wrong_vibe | menu | price | been_there
  followup      text,                -- the answer to the one follow-up question
  context       text,                -- what context was active
  match_pct     smallint,
  created_at    timestamptz default now()
);

awards (
  id            uuid pk,
  cafe_id       uuid references cafes,
  axis          text not null,
  context       text,
  neighbourhood text,
  qualifier     text,
  rank          smallint not null,
  period        date not null,       -- week computed
  matchup_count int not null
);

-- ============ SAFETY (v1.3) ============
blocks (
  blocker_id    uuid references users,
  blocked_id    uuid references users,
  created_at    timestamptz default now(),
  primary key (blocker_id, blocked_id)
);
-- Bidirectional in effect: filter both directions on every read.

reports (
  id            uuid pk,
  reporter_id   uuid references users,
  subject_type  text not null,   -- user | photo | note
  subject_id    uuid not null,
  reason        text not null,
  detail        text,
  status        text default 'open',  -- open | actioned | dismissed
  created_at    timestamptz default now(),
  resolved_at   timestamptz,
  resolved_by   text
);

-- ============ MEMBERSHIP ============
memberships (
  user_id             uuid pk references users,
  stripe_customer_id  text,
  stripe_sub_id       text,
  status              text,   -- active | past_due | canceled | trialing
  period_start        timestamptz not null,
  period_end          timestamptz not null,
  rounds_total         smallint default 4,
  rounds_used          smallint default 0,
  form_points         int default 0,
  bonus_round_earned   boolean default false
);

redemptions (
  id            uuid pk,
  user_id       uuid references users,
  cafe_id       uuid references cafes,
  period_start  timestamptz not null,
  nonce         text unique not null,
  issued_at     timestamptz default now(),
  expires_at    timestamptz not null,
  redeemed_at   timestamptz,
  staff_pin_used text,
  status        text default 'issued',  -- issued | redeemed | expired | voided
  unique (user_id, cafe_id, period_start)   -- enforces one-per-café-per-period
);

form_events (
  id            uuid pk,
  user_id       uuid references users,
  kind          text not null,   -- check_in | ranking | photo | review | referral
  points        smallint not null,
  ref_id        uuid,
  created_at    timestamptz default now()
);
```

**The constraint that carries the business model:** `redemptions_user_cafe_period_key`. That single unique index is what forces members across multiple cafés. Do not let anyone "optimize" it away.

**Indexes needed:** `cafes(lat,lng)` via PostGIS or a geohash column; `cafe_elo(cafe_id, axis)`; `matchups(user_id, created_at desc)`; `stamps(card_id)`; `receipts(dedupe_hash)`; `reimbursements(cafe_id, period)`.

---

## 11. Architecture & API

### 11.1 Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15, App Router, TypeScript** | Same as Caught Sipping; one codebase for marketing site + web app + café portal |
| Styling | **Tailwind CSS v4** with the tokens from §4.2 as CSS vars | Fast, and design tokens map cleanly |
| Components | **shadcn/ui**, restyled to tokens | Don't build a dropdown from scratch |
| Auth + DB | **Supabase** (Postgres, Auth, Storage, RLS) | Auth, DB, file storage, and row-level security in one; magic-link auth suits this audience |
| Maps | **Mapbox GL JS** + Static Images API | Custom-styleable to the palette, which Google Maps is not |
| Payments | **Stripe Billing** (+ Connect later if reimbursing) | Subscription primitives out of the box |
| Email | **Resend** + React Email | Receipts, weekly drop, partner counters |
| Analytics | **PostHog** | Funnels + feature flags + session replay in one |
| Hosting | **Vercel** | Next.js native |
| Mobile | **PWA first**, Expo/React Native at Phase 4 | Don't build native before you know the matching works |

**Why PWA before native:** the only feature that genuinely needs native is background geofencing, which you don't need for v1 (check-in is user-initiated). Shipping web first saves you 8+ weeks and an app store review cycle before you've validated the core loop.

### 11.2 Matching service

Put the scoring in **one module**, `lib/matching/`, not scattered through route handlers:

```
lib/matching/
  vectors.ts        // cosine, weighted euclidean, clamp helpers
  tasteFit.ts       // Layer 1
  socialProof.ts    // Layer 2, with shrinkage
  contextFit.ts     // Layer 3, context definitions
  score.ts          // combine, weight table, floor/ceiling
  explain.ts        // reason generation
  learn.ts          // post-ranking vector update
  constants.ts      // ALL tunable weights live here
```

Every tunable number in `constants.ts` and nowhere else. You will retune these constantly after launch and you do not want to be grepping.

**Compute strategy:** score on read, not on write. For a single user's Discover feed you're scoring maybe 200 cafés against one vector — that's microseconds. Precomputing a match matrix is premature and goes stale the moment a ranking lands. Cache the day's Today’s Pick only.

### 11.3 API surface

```
POST   /api/quiz/submit           → { primary_drink_category, vector, max_radius_m, worth_the_trip, top_matches[] }
GET    /api/matches/daily         → { cafe, match_pct, reasons[] }
GET    /api/matches?context=&cursor=  → paginated match feed
GET    /api/map?bounds=&context=  → pins with match bands
GET    /api/cafes/:slug           → profile + user's match + friend activity
POST   /api/checkins              → { cafe_id, lat, lng } → verified bool
GET    /api/matchups/next         → { axis, cafe_a, cafe_b }  // opponent selection
POST   /api/matchups              → { axis, cafe_a, cafe_b, winner } → updated Elo
POST   /api/cafes/:id/note        → personal note
GET    /api/me/type               → current taste vector + history
PATCH  /api/me/type               → manual adjustment
POST   /api/ondeck                 → add/remove
POST   /api/friends/request | accept | remove
POST   /api/setups                → send a café to a friend
POST   /api/rounds/activate        → { cafe_id } → { qr_jwt, code, expires_at }
POST   /api/portal/redeem         → { code | jwt, staff_pin } → redemption result
GET    /api/portal/summary        → café's redemption stats
POST   /api/receipts              → upload → OCR → auto-check → stamp or queue
GET    /api/card                  → current stamp card + un-stamped partners nearby
GET    /api/awards?axis=&hood=    → weekly award set
POST   /api/rejections            → { cafe_id, reason } → follow-up question
POST   /api/rejections/:id/answer → { answer } → re-scored recommendations
GET    /api/portal/menu | PUT     → café menu submission + item tagging
GET    /api/portal/reward-menu        → current and upcoming monthly eligible-item menus
PUT    /api/portal/reward-menu        → submit, repeat, or pause next month’s list
PATCH  /api/portal/reward-items/:id   → mark an approved item available or unavailable
GET    /api/portal/receipts       → queue of receipts needing confirmation
POST   /api/portal/receipts/:id   → approve | dispute
GET    /api/portal/insights       → quarterly report data
POST   /api/blocks                → block a user (bidirectional effect)
POST   /api/reports               → report a user, photo, or note
POST   /api/partner-interest      → café application form
```

### 11.4 Security notes

- **The firewall is architectural (§5.1).** `lib/matching/` must not import or receive `cafe_subscriptions`. Its function signatures take vectors and context, nothing else. Tier filtering lives in the query layer above it. Add a unit test asserting that a Listed cafe and a Partner cafe with identical vectors produce identical Match % — make the violation fail CI.
- Every read of users or activity filters `blocks` in both directions.
- RLS: users read only their own `taste_profiles`, `on_deck`, `stamp_cards`, `receipts`. Matchups and Elo are readable by accepted friends only. Café data is public.
- Receipt verification is server-side (§3.1f). Never trust a client-reported approval, and never let the client compute a stamp.
- Portal redemption requires the café's `portal_pin`, rate-limited to 20 attempts/hour per café.
- The QR JWT is signed with a server-only key and never leaves the API except as an opaque string.

---

## 12. Screens

### 12.1 Marketing site — two stages, not one **[REVISED v3.6]**

The marketing site ships twice, on purpose. §0.4 already covers why: the pre-launch stage (12.1a) has no cafés seeded and no matching engine to demo, so it doesn't try to fake either — it collects emails and survey answers instead. The public stage (12.1b) is everything this section used to describe as day one, and it only starts once §0.4 has run and the homework in §0.5 is done.

#### 12.1a Pre-launch site — no accounts, awareness + input only

```
/                                          Hero → why this is different → join the list (email only)
/for-cafes                                 Partner pitch → "discovery never stops" → FAQ (§13.7) → application/survey
/help-shape-the-app                        Links to both surveys below
/help-shape-the-app/cafe-partner-survey    §13.6.1, 5 steps
/help-shape-the-app/consumer-survey        §13.6.2, 6 steps
/privacy /terms
```

Nav: **Help Shape the App** · **Catch Us on Instagram** — copied straight from Caught Sipping's live nav, because it's the right instinct: every link goes somewhere a visitor can act on without an account. No "Sign Up," no "Log In."

**Hero — no live quiz here, and that's deliberate.** §0.4 already rules this out: a three-question mini-quiz that resolves to "your top match" needs seeded cafés and a working scoring function, and this stage has neither. Faking it with placeholder cafés would be a worse first impression than not showing it at all. Say the idea in one screen instead, and ask for one thing — an email.

```
┌────────────────────────────────────────┐
│  ⟨ logo ⟩          Help Shape the App  Instagram │
├────────────────────────────────────────┤
│                                              │
│   MATCHED TO YOUR NEXT FAVOURITE CAFÉ,       │
│   BEFORE CALGARY FINDS IT.                   │
│                                              │
│   Calgary has 60+ independent cafes.         │
│   BREW AND THE CITY is building a way to     │
│   match you to yours — by taste, not by      │
│   review count.                              │
│                                              │
│   [ you@email.com          ] [ Join the list ]│
│                                              │
│   Café owner? → /for-cafes                   │
└────────────────────────────────────────┘
```

`/for-cafes` keeps this section's original structuring principle, and it's still the right one to copy exactly: **discovery is a timeline, not a features table.** Caught Sipping separates *"your café doesn't stop getting discovered after the first visit"* (free, automatic, ongoing — the map, saves, City Picks, friend activity) from the paid redemption mechanics, and presents the free half first. That reframes Listed vs. Partner (§3.0.1) from a pricing table into a story a café owner already understands: we get you found, permanently, for nothing; if you also want the loyalty and reward layer, here's what that adds.

Concretely: open `/for-cafes` with a section titled around that line, showing the Proximity Map *as an illustration, clearly labelled as a mockup* — small cards like *"Maya saved this café"* or *"Jordan ranked it #2 for Vibe"* appearing near a café's pin. It's still just a picture at this stage (no real friend graph exists yet), but it makes Layer 2 (§7.3) legible to an owner who has never seen the product, which is the whole job of the page. End the page in the café survey (§13.6.1) or a plain "email us to apply," never a form that provisions an account.

The founding-partner framing card (mirrors Caught Sipping's own hero card on `/for-cafes`) belongs directly under the fold:

```
┌──────────────────────────────────────────┐
│  FOUNDING PARTNER                          │
│                                            │
│  ○  YOUR CAFÉ                              │
│     PART OF THE FIRST CALGARY GROUP        │
└──────────────────────────────────────────┘
```

Followed by the four-benefit grid already specced for the sales conversation (§3.0.3, §13): **First In The App**, **Priority Placement**, **More Local Attention**, **Launch Event Opportunity** — same content, just laid out as four icon cards the way Caught Sipping does it, so an owner can scan it in ten seconds before deciding whether to read further.

#### 12.1b Public launch site — live product, no waitlist

Everything this section described in earlier versions, unchanged, and it now explicitly starts *after* 12.1a has run its course:

```
/                 Hero (live quiz) → How matching works → The City Card → Sign up
/for-cafes        Partner pitch → "Discovery never stops" → FAQ (§13.7) → The 8:1 ratio → Pricing → Application
/partners         Public directory of partner cafes (SEO asset — each cafe gets an indexed page)
/how-it-works     The algorithm, explained honestly. This page is a trust asset.
/privacy /terms
```

**Live from day one of this stage — no "coming soon."** A waitlist screen made sense when the product didn't exist, which is exactly what §0.4 is for. By the time 12.1b ships, it doesn't: a visitor takes the quiz, sees real Calgary cafés ranked for them, and signs up to save it. Every "coming soon" screen at this stage is a place someone leaves and never returns — the pre-launch waitlist from 12.1a already did that job, and everyone on it gets one email the day this stage goes live.

**Hero thesis:** not a phone mockup. Run a **live three-question mini-quiz** in the hero, and resolve it into a real Proximity Map (§8.2a) with three real Calgary cafes plotted around the visitor's dot. The product's whole argument is "we can tell what you'd like" — demonstrate it above the fold instead of describing it.

Three questions is the right number for the hero: enough to capture drink category, drink style, and room energy without asking for the full profile. Use Q1, Q2, and Q3 from Appendix A — four options each, with Q2 adapting to Q1. The hero resolves to a rough top 3, then signup to save and complete Q4–Q9.

```
┌────────────────────────────────────────┐
│  ⟨ logo ⟩                    Instagram  Join │
├────────────────────────────────────────┤
│                                              │
│   BREW AND THE CITY                             │
│                                              │
│   Calgary has 60+ independent cafes.         │
│   Three questions and we'll tell you         │
│   which one is yours.                        │
│                                              │
│   ┌────────────┐   ┌────────────┐            │
│   │  quiet     │   │  buzzing   │  ← tap one │
│   │  corner    │   │  counter   │            │
│   └────────────┘   └────────────┘            │
│              1 of 3                          │
│                                              │
└────────────────────────────────────────┘
     ↓ after 3 taps ↓
┌────────────────────────────────────────┐
│          bold & unsweetened                 │
│                   │                          │
│                   │   ○ Monogram (Bankview)  │
│     quiet ────────┼───────────── loud     │
│                   │ ● You                    │
│        ○ Rosso    │    ○ Sought x Found      │
│            sweet & creamy                    │
│                                              │
│   Closest to you: Monogram — 91% match       │
│   Quiet, unsweetened, room to sit.           │
│                                              │
│   [ Sign up free — see all 60 → ]         │
└────────────────────────────────────────┘
```

Use **real Calgary cafes with real names** in the hero, not placeholders. It's the difference between a demo and a product. It also means local visitors immediately recognize a name and trust the axis placement — or argue with it, which is just as good.

### 12.2 App screens (Phase 2+)

| Screen | Key elements |
| --- | --- |
| Quiz | 9 single-select questions, progress indicator, no skipping |
| Today | Today’s Pick card, ring, 3 reasons, accept/pass |
| Discover | Context selector, top 3 ranked, "worth the drive", refresh |
| Map | Mapbox, band-coloured pins, bottom sheet on tap |
| Café Profile | Photos, Match % + reasons, attributes, friend activity, City Card CTA, rank button |
| City List | Sortable saved list |
| Regulars | Visit counts, your ordered list per axis, "your #1 for The Space" badges |
| City Pick | Two café cards, one axis, tap to pick or “too close to call” |
| Top Ranked | Weekly leaderboard, sub-lists by axis, Partners/All toggle, movement arrows |
| Feed | Reverse-chron friend activity |
| Your Taste | Seven dimension bars, editable, history sparkline |
| City Card | Stamp card (striped edge), progress, nearby partners you haven't stamped |
| Upload receipt | Camera, crop, submit, live status |
| Awards | Award grid by neighbourhood and context, weekly, movement arrows |
| Not it | One question, four to five chips, immediate re-recommendation |
| Reward live | Big QR, 4-char code, countdown, café name |

### 12.3 Café Portal (separate route, `/portal`)

Deliberately ugly-simple. Staff use it during a rush on a shared iPad.

```
┌────────────────────────────────┐
│  [Café Name]        Today: 7   │
├────────────────────────────────┤
│                                │
│      ┌──────────────┐          │
│      │   SCAN QR    │          │
│      └──────────────┘          │
│                                │
│      or enter code             │
│      ┌──┐┌──┐┌──┐┌──┐          │
│      │  ││  ││  ││  │          │
│      └──┘└──┘└──┘└──┘          │
│                                │
├────────────────────────────────┤
│  Today's item:                 │
│  Complimentary 12oz matcha     │
│  Available Tue–Thu 1–5pm       │
└────────────────────────────────┘
```

Success state: full-screen green, café name, item, 3-second auto-dismiss. Failure state: full-screen amber with the *specific* reason ("Already redeemed here this month" / "Code expired — ask them to refresh"). Never a generic error — staff need to know what to say to the customer.

---

## 12.4 Cafe Insights — quarterly report **[NEW v1.5]**

**Your best retention lever, and it costs you nothing marginal.**

You will hold taste vectors for hundreds of Calgarians and head-to-head results on every cafe in the city. That lets you tell a cafe something no consultant, POS vendor, or review site can:

```
KISSA NISHI — Q3 2026

WHERE YOU RANK
  The Space        #3 in Calgary   ↑ 2      (412 matchups)
  The Return   #7              →        (388 matchups)
  The Drink       #14             ↓ 3      (401 matchups)

  Your room is doing the work. Your drink isn't keeping up.

WHO MATCHES WITH YOU
  Quiet-and-lingering seekers      68%
  Prefer unsweetened               54%
  Need oat milk                    61%
  Median match distance            2.4 km

WHAT THEY ORDERED
  Ceremonial Latte                 41% of your matched visits
  Hojicha Latte                    22%
  Strawberry Matcha                 3%   ← tagged sweet; your
                                          audience skews unsweetened

WHAT WE'D TRY
  • Your Drink rank is your weak axis and your highest-volume
    complaint in "not it" responses (too grassy, 31%).
  • 61% oat need vs. oat-as-upcharge is costing you matches.
  • You have no item tagged "sweet + unsweetened-friendly."
    The gap is real and nobody in Kensington fills it.

THE CITY CARD
  Visits stamped here                167
  Rewards redeemed here              22   ($88 reimbursed to you)
  Revenue from stamped visits    ~$1,085
```

**Why this works:** it converts your worst conversation — *"why am I still paying you?"* — into your best one. It is impossible for a competitor to copy without your dataset. And it's a clean justification for Featured tier if you want to gate the deeper version.

**Rules:**
- Quarterly, not monthly. Monthly data is noise at this scale and monthly reports become wallpaper.
- **Never name individual users.** Aggregate only, minimum cell size of 10 — no "the person who ranked you #1." A cafe learning something about a specific customer is a privacy breach and a trust event you don't recover from.
- **Never compare a cafe to a named competitor.** Rank position is fine; "you're behind Rosso on Vibe" is not. You are selling to both of them.
- Generated automatically from existing tables. If it takes manual work, it won't survive past cafe #20.
- **[DECIDE]** Partner tier gets the report; Featured gets the report plus a 30-minute call to walk through it. That call is where renewals actually happen.

## 13. Café acquisition

You need ~15 Founding Partners before launch. This is sales, not product, and it's the actual hard part.

**The pitch, in order:**
1. You choose the item, and you can change it monthly.
2. You choose the hours — protect your rush, fill Tuesday at 2pm.
3. You set a monthly cap, so this can never cost more than you decided.
4. No POS integration, no new hardware — a web page and a PIN.
5. Every redeemer is someone who *matched* with you, not a random deal-hunter. Higher return rate than a Groupon by construction.
6. Founding Partners get priority placement and the launch event.

**What kills the deal:** staff training overhead, anything that touches their POS, or a deliverable too vague to hold you to. The spec avoids all three — and under v1.4 the cafe gives away nothing, which removes the biggest objection from earlier versions. Lead with the 8:1 ratio (§3.1a), then the price.

**Calgary approach order.** Start with independents in the walkable clusters, not the multi-location roasters. A single-location owner can say yes in one conversation; Rosso or Phil & Sebastian will route you to a marketing calendar and three months of nothing. Get 10 single-location Founding Partners signed, then approach the multi-location names with proof — they're far more valuable as partner #12 than partner #1, and much easier to sign once the app exists.

Clusters, in the order I'd walk them: **Beltline → 17th Ave/Mission → Kensington → Inglewood → Bridgeland → downtown/Stephen Ave.** Beltline first because it has the highest density of both cafes and the 25–35 renters who are your core user.

**Winter note:** sign partners in September–October if you can. A cafe owner staring down a slow January is dramatically more receptive to "free foot traffic on Tuesday afternoons" than the same owner in June.

**Onboarding data you must collect per café** (this is the vector seed — you cannot skip it):
- All 7 taste dimensions, rated by you after an in-person visit
- All `cafe_attributes` fields
- Hours, photos, offer item, availability windows, cap

Budget ~45 minutes per café. Fifteen cafés is a real week of work. Plan for it.

### 13.1 Multi-location cafés — one slot per physical location **[DECIDED v3.5]**

Caught Sipping's own onboarding survey asks a café how many locations it has, up front — because the answer changes the deal. Yours needs the same answer, and a policy to go with it.

**The rule: each physical location counts as one Founding Partner slot, but a multi-location group signs a single agreement and gets a single portal login with per-location stats.**

Reasoning:

- **Neighbourhood coverage is the actual scarce resource**, not café-owner relationships. §1.5 built the 15-slot launch around six walkable clusters specifically so the map isn't lopsided. If a 3-location group counted as one slot, one group could fill a fifth of your entire launch cohort from three doors in the same two clusters, and three neighbourhoods lose a Founding Partner seat to give it to them.
- **One agreement per group is still the right sales unit.** Nobody wants to negotiate the same terms three times with the same owner. The agreement lists every participating address as a schedule, and each address draws its own slot.
- **A group can join gradually.** A 4-location group can commit 2 locations to the Founding cohort and add the other 2 as standard Partners later, or as Listed. Nothing requires all-or-nothing.

**Practical consequence for §13's approach order:** a multi-location group is now explicitly worth **more than one slot's worth of effort** to close, not less — signing Rosso's 3 Calgary locations in one conversation is 3 of your 15 slots and 3 clusters covered in a single sales call. Move the "approach multi-location names" step earlier than v1.4's sequencing suggested, once you have 3–4 single-location signatures as proof.

**Portal implication:** `partner_cafes` already keys by individual `cafe_id` (§10), so this needs no schema change — only a `partner_group_id` column linking locations that share one agreement and one primary contact. Add it now; it costs nothing empty and saves a migration later.

---

## 13.5 The live stamp counter — cafe retention

**The gap this closes.** A cafe's only scheduled proof of value is the quarterly Insights report (§12.4). That works for Founding Partners who got an extraordinary deal. It does not work for Partner #25 paying full price who has three months of silence between reports and a renewal decision every month.

**Churn happens in the silence.** The fix is not more reports; it is making the portal worth opening.

**The portal home screen is a live counter, not a menu:**

```
┌───────────────────────────────────────┐
│  KISSA NISHI                 This week    │
├───────────────────────────────────────┤
│                                            │
│        14                    ↑ from 9      │
│     stamps earned here                     │
│                                            │
│  ~$91 in matched visits                    │
│  3 first-time customers                    │
│  2 rewards redeemed  ($8 owed to you)      │
│                                            │
│  You're #2 for Vibe in Kensington          │
│                                            │
│  [ 1 receipt needs a look ]                │
└───────────────────────────────────────┘
```

**Design rules:**
- **One number, huge.** Stamps this week. Everything else is supporting text. An owner should get the answer in under two seconds standing behind a counter.
- **Always show the week-over-week arrow.** Direction is more motivating than magnitude.
- **"First-time customers" is the number that justifies the subscription** — it is the thing they cannot get anywhere else and the thing they are actually buying. Surface it every week, not quarterly.
- **Show money owed, not money spent.** "$8 owed to you" reads as income. "$8 reimbursement pending" reads as accounting.
- **Never show a bad week without context.** If stamps drop, show the city-wide trend alongside: *"citywide traffic down 22% this week."* A cafe that thinks it's failing alone cancels; one that sees weather cancels nothing.
- **Weekly email, same content.** Most owners will never log in. Send Monday morning, one screen, same numbers, unsubscribe honoured. The email is the product for 70% of your partners.

**[DECIDE]** whether Listed (free) cafes get a stripped counter showing what they're missing — *"11 people matched with you this week and could not stamp here."* It is the best conversion tool you will have, and it is also slightly coercive. My read: yes, but state the number plainly and never editorialize it.

---

## 13.6 Pre-launch validation surveys **[NEW v3.5]**

Several `[DECIDE]` items in this document are currently your best guess: the $4 reimbursement rate (§3.0.5), the eventual $89 Partner price (§3.0.1), which perks cafés actually want (§3.1b.1), and what a Calgarian would pay for a consumer tier if one ever returns. Caught Sipping is answering these questions with two short surveys before writing a line of app code, one aimed at cafés and one at coffee drinkers. Run the same play — it is nearly free and it converts four guesses into four answers.

**Ship both as Typeform, Tally, or a plain page — not inside the app.** Neither survey needs the product to exist. They live on the pre-launch site (§0.4) at `/help-shape-the-app/cafe-partner-survey` and `/help-shape-the-app/consumer-survey`, matching the URL pattern already visible in the Caught Sipping screenshots, both reachable from a single `/help-shape-the-app` nav link with no login.

### 13.6.1 Café-side survey — 5 steps, ~3 minutes

| Step | Ask |
| --- | --- |
| **1. Who you are** | Café name, contact name, email, city/area, Instagram or website, **number of locations** (1 / 2–3 / 4–10 / 10+) — feeds §13.1 directly |
| **2. When you're slow** | Multi-select: which days are usually slower; which parts of the day are usually slower |
| **3. What you'd offer** | Multi-select, choose up to 3: a selected full-size drink, drip coffee, cold brew, espresso or small item, mini specialty drink, pastry or bakery item, tasting item, exclusive off-menu item, limited-time special, not sure — **this is your menu-item perk sheet (§3.1b.1), validated instead of assumed** |
| **4. What worries you, and what you want** | Multi-select up to 3 concerns: too many redemptions at once, people claiming the item and buying nothing else, product cost, staff confusion, fraud or screenshots, slowing down service, existing customers abusing it, not knowing if the customer returns, not concerned, other. Second question, up to 3: which results matter most — new customers, more traffic in slow periods, additional purchases, customers returning, more saves or shares, social awareness, strong performance on one item, useful reporting and insights |
| **5. Willingness** | Single-select: very open to it / open to testing it / want to understand redemption limits first / want to know the type of customer it brings / concerned about the cost / not sure yet. Optional free text: *"What would make you genuinely interested in becoming a partner?"* |

**What step 4 is actually for:** the concerns list is a pre-built objection-handling script for §13's sales pitch — whichever concern gets picked most becomes the first thing you address, unprompted, in every café conversation from then on. The "results that matter" list tells you which line of the Café Insights report (§12.4) to lead with.

### 13.6.2 Consumer-side survey — 6 steps, ~2 minutes

| Step | Ask |
| --- | --- |
| **1–4** | Standard intake: how they currently find cafés, what makes them return, how much friends influence where they go (a lot / somewhat / occasionally / not much) — validates the Layer 2 social weight in §7.5 |
| **5. What would make them try somewhere new** | Multi-select up to 3: a selected full-size drink, cold brew or drip coffee, mini specialty drink or tasting item, pastry or bakery item, exclusive off-menu item, a limited-time drop, special event or early access, "perks aren't a big reason I try cafés" |
| **6. Pricing** | *"How much would you realistically spend each month on a coffee membership if it consistently saved you money and helped you discover great cafés?"* — around $10–20, around $20–30, $30+ if the value was there, would need to see the cafés and benefits first. Optional free text: *"What would make you genuinely excited to use [app]?"* |

**Why this matters even though the consumer app is currently free (§3.1e).** A consumer subscription is explicitly not in v1 — but this question costs one line in an existing survey, and if a real number comes back (not zero, not "I'd never pay"), that's evidence for the eventual $4.99 convenience tier §3.1e already sketches, gathered before you need it rather than after.

**Distribution:** post both to your own network, the Founding Partner cohort once the first few sign, and Calgary-specific subreddits and Facebook groups for the café-facing one. Target 20–30 café responses and 100+ consumer responses before treating any answer as a real signal — five replies is anecdote, not data.

---

## 13.7 For-cafés FAQ **[NEW v3.5]**

Caught Sipping's `/for-cafes` page answers eleven objections in an accordion before a café owner has to ask them out loud. Yours currently only answers them in your head, as talking points for a live conversation (§13). Write them down — an owner reading alone at 11pm needs the same answers a founder gives in person.

| Question | Answer |
| --- | --- |
| **Do I need a new POS system?** | No. Redemption happens through the Café Portal on any device with a browser — a phone, a tablet, the till's own screen. Nothing touches your existing POS. |
| **How does my team confirm a redemption?** | Staff scans the member's QR code in the Portal, or types the 4-character fallback code if scanning isn't convenient. Confirmed in under five seconds. |
| **Does my café have to track monthly use?** | No — the Portal does it automatically. Your weekly counter (§13.5) shows redemptions, first-time visitors, and reimbursement owed without any manual tracking. |
| **How often can a member redeem at my café?** | Once per City Card, and a card requires 5 visits at 5 different eligible items across the network — see §3.0.5 for the exact mechanic. |
| **Why is there a monthly cap?** | So the most this can ever cost you is a number you chose in advance. You set it; you can lower it or raise it any month. |
| **Can I choose the item?** | Yes — you submit your eligible-item list by the 25th of each month (§3.0.5). Keep it, change it, or pause redemptions entirely with no effect on your Match % or map visibility. |
| **Can I choose the days and times it's available?** | Yes. Most partners protect their morning rush and open redemption during a slower afternoon block. |
| **What happens if the QR code doesn't scan?** | Staff types the 4-character fallback code instead. Every redemption has both paths from the start. |
| **Can I leave the program?** | Any time, with 30 days' notice on the active partner tier. You keep a free Listed profile unless you ask to be removed entirely. |
| **Can more than one location join?** | Yes — see §13.1. Each address is its own Founding Partner slot, but one agreement and one portal login covers your whole group. |
| **Do I have to give anything away for free?** | Only if you opt into reward redemption, and even then only the specific items you chose, capped at the limit you set. Listed and Partner status never require it. |

**Where this lives:** as a spec reference now; build it into `for-cafes.html` as an accordion once you're back in the code (matches the pattern already visible in the Caught Sipping screenshots — collapsed by default, one open at a time).

---

## 14. Build phases

| Phase | Scope | Rough effort |
| --- | --- | --- |
| **0. Validation** | Name/domain clearance, pick market, walk 20 cafés and ask if they'd partner | 2 weeks, no code |
| **0.5. Pre-launch site** | Static site, no accounts: hero + waitlist email, `/for-cafes`, `/help-shape-the-app` with both surveys, Instagram live (§0.4, §12.1a) | 3–5 days |
| **1. Marketing site (public launch)** | Landing + interactive hero quiz + live signup + `/for-cafes` + application form — replaces 0.5 once cafés are seeded (§12.1b) | 1–2 weeks |
| **2. Data + matching core** | Schema, seed 60 cafés with vectors, `lib/matching/`, unit tests on scoring | 2 weeks |
| **3. Web app MVP** | Auth, quiz, Today, Discover, Map, Café Profile, check-in, City Picks + Elo, City List, Regulars | 4–6 weeks |
| **4. Social** | Friends, feed, café sharing, Layer 2 live, blocks + reports + moderation queue | 3 weeks |
| **5. City Card + billing** | Receipt upload, OCR, auto-check, stamp logic, redemption, Café Portal, Stripe subscriptions for cafes, reimbursement ledger | 5 weeks |
| **5b. Menus + refinement** | Menu submission and tagging in Portal, item-level matching, the 100% state, "Not it" loop | 2 weeks |
| **7. Insights + Awards** | Quarterly report generation, weekly award computation, decal fulfilment | 2 weeks |
| **6. Native** | Expo wrapper, push notifications, background geofence | 4 weeks |

**Phase 2 has a hard gate:** before building any app UI, seed 60 real cafés, seed your own taste vector, and check whether the top 10 matches are cafés you'd actually like. If the algorithm can't match *you*, it can't match anyone, and you'd rather find that out in a spreadsheet than after Phase 3.

---

## 15. Open questions

### Settled

| # | Decision |
| --- | --- |
| Name | BREW AND THE CITY |
| Launch market | Calgary, Alberta — 60 seeded cafes, 15 Founding Partners, six walkable clusters (§1.5) |
| Calgary | Free Listed profiles; the first 15 approved Founding Partners receive Partner benefits free for six months (§3.0) |
| Founding exchange | Six months of Partner benefits plus launch extras; City Card stamps are included, while monthly free-item redemption is optional. Participating cafés contribute approved items within their chosen cap (§3.0.4–3.0.5) |
| Founding conversion target | ≥10 of 15 choose the $49/month continuation after seeing six months of results (§3.0.7) |
| Revenue | Café subscriptions begin as Founding Partners convert; consumer app stays free (§3.1) |
| Loyalty | The City Card — 5 verified beverage visits, then one eligible café item free at a participating redemption café; max 2 stamps per café per card (§3.1a) |
| Stamp proof | Receipt upload → OCR auto-approve → café dispute window (§3.1f) |
| Qualifying purchase and reward | A beverage purchase earns a stamp; the reward may be a beverage, pastry, small food item, or café-selected special from the active monthly list (§3.1g) |
| Match priority | Need, flavour, distance, social — context never below 0.35, proximity never below 0.20 (§7.5) |
| Quiz | 9 questions, 4 options each, resolves to top 3 (Appendix A) |
| Site | Two stages — no-account pre-launch first (§12.1a), then live public product with no "coming soon" screen (§12.1b) |
| Brand | **BREW AND THE CITY** — all beverages, not matcha-first (v3.0) |
| Palette | Espresso primary, powder blue differentiator, green demoted to a drink signal (§4.2) |
| Meets | Cut entirely (v1.7) |
| Visual system | Two-surface rule — marketing loud, product quiet (§4.1) |
| Rankings | No city-wide leaderboard. Many small awards by axis × context × neighbourhood (§8.2b) |
| Menus | Partners submit monthly; item-level matching defines the 100% state (§8.2c) |
| Retention | Quarterly Café Insights reports (§12.4) |
| Pricing | Listed free / first 15 Founding free for 6 months then optional $49 locked / Partner $89 / Featured $189 (8 slots) (§3.1b) |
| Perks | Full countable perk sheet by tier (§3.1b.1) |
| Post-trial revenue | Brand campaigns → consumer sub → café subs in city two (§3.1c.1) |
| Accessibility | WCAG 2.2 AA; the Proximity Map's text list is primary, not fallback (§18.5) |
| Ranking integrity | Payment buys inclusion in promotional surfaces, never position or Match % (§5.1) |
| Pre-launch | Static site, no accounts — awareness (Instagram) plus two validation surveys, before any code beyond a landing page (§0.4, §12.1a) |
| Signup | Email + magic link, before the quiz — applies to the public launch app, not the pre-launch site (§6.1, §0.4) |
| Core mechanic | Quiz → flavour-profile proximity, rendered as the Proximity Map (§8.2a) |
| Ranking | Head-to-head City Picks, per-axis Elo (§8.6) |
| Dark mode | Skipped for v1 (§4.2) |
| Domain / handle | brewandthecity.com / @brewandthecity — one string everywhere (§2.1a) |
| Stack | Next.js 15 + TS + Tailwind + Supabase + Mapbox + Stripe (§11.1) |

### Still blocking

1. **Set the six-month founding start and end dates.** Each café’s dates should appear in its agreement and onboarding confirmation.
2. **Get the Founding Partner agreement reviewed.** One page: six months free, capped reward contribution, optional $49 continuation, no surprise billing, data and content permissions, and exit terms.
3. **Confirm the monthly reward-menu model with real cafés.** Test the 25th-of-month submission deadline, one-to-five-item list, optional participation, and the default 10-redemption founding cap with at least five owners.
4. **Confirm the launch content capacity.** The v3.4 model promises one dedicated launch feature and one mini-shoot per Founding Partner, not monthly custom content for all 15.

### Important, not blocking

4. Who seeds cafe vectors past ~100 venues? It doesn't survive being your job forever.
5. **Does "Matcha" in the name limit you?** The name says matcha; the product covers all cafes, and Calgary's scene is coffee-first — Monogram and Phil & Sebastian are roasters, not matcha bars. Fine as positioning (matcha is the wedge and the aesthetic, coffee is the volume), but the landing page copy has to be explicit about it or people will assume you only list matcha shops. Suggested line: "Every good cafe in Calgary. Matcha optional."
6. Non-partner cafes: do they appear? **Yes** — a map with 15 cafes is useless, and Listed cafes are also your sales pipeline: every unpaid cafe with high organic Match % is a warm lead you can walk in and show data to.
7. Winter distance weighting (§1.5). Ship v1 without it, add `season_distance_multiplier` once you have a November's worth of data.
8. Moderation for photos and cafe notes. Needed before the social feed ships, not before that.
9. Alberta privacy compliance (PIPA) for location data, receipt images, and the friend graph. Get the privacy policy right before signup collects a single email.

---

## 16. Admin console — build before the consumer app

Nothing in this product functions without seeded cafes, and nothing stays functional without operational tooling. This is not a phase-6 nicety; it is the first thing built.

Internal only, behind auth, no design budget. Plain tables and forms.

| Screen | What it does |
| --- | --- |
| **Cafe editor** | Create/edit a cafe: drink categories served, all 7 vector dimensions as sliders with the §7.1 anchors labelled, all `cafe_attributes`, hours, photos, neighbourhood, geocode. **Bulk CSV import** for the initial 60 — you will seed in a spreadsheet, so accept a spreadsheet. |
| **Vector tuner** | Enter a test taste vector, see the ranked match output live. This is how you validate the algorithm and how you debug "why did it recommend that." |
| **Merchant strings** | Map OCR merchant text → cafe. When a cafe's receipts stop auto-approving it is almost always this, and fixing it must take 10 seconds. Show auto-approve rate per cafe; anything under 80% is flagged. |
| **Receipt queue** | Global view across all cafes. Approve, reject, force-stamp. Includes anything a cafe let expire past 72h. |
| **Reimbursement run** | Monthly: list accrued reimbursements by cafe, mark paid, generate a statement PDF per cafe. Manual payout by e-Transfer at this scale (§15). |
| **Moderation queue** | Reports on photos, notes, and profiles. 24h SLA. Actions: dismiss, remove content, warn, suspend, ban. |
| **Partner admin** | Tier, status, price, contract dates, marketing deliverables owed this month. |
| **Award override** | Force-recompute; suppress a category that produced something wrong or unfair. |
| **Feature flags** | Kill switches for the receipt pipeline, notifications, and the match feed. When OCR costs spike at 2am you need a switch, not a deploy. |

**Access:** single admin role for now. Log every mutating action with actor and timestamp — not for compliance, for debugging your own mistakes at 11pm.

---

## 17. Notifications

Currently unspecced, which means a coder builds nothing or builds spam. Neither is recoverable.

| Trigger | Channel | Timing | Default | Kill-switch |
| --- | --- | --- | --- | --- |
| Weekly drop — seasonal items matching your taste (§8.15) | Push + email | Mon 8:00 local | **On** | Per-channel |
| Receipt approved, stamp added | Push | Immediate | On | Yes |
| Receipt needs another photo | Push + email | Immediate | On | No — transactional |
| Reward earned (5th stamp) | Push | Immediate | On | No — they earned it |
| Reward expiring in 7 days | Push | 09:00 | On | Yes |
| Today’s Pick | Push | 07:00 local | **Off** | Yes |
| Monthly menu due (cafe) | Email | Day 25, again day 40 | On | No — contractual |
| Weekly counter (cafe) | Email | Mon 07:00 | On | Yes |
| Receipt awaiting confirmation (cafe) | Email | Daily digest, only if non-empty | On | Yes |

**Rules:**
- **Hard cap: 3 consumer pushes per week**, transactional excluded. Enforce in code, not in policy.
- **Today’s Pick defaults OFF.** A daily push before anyone has habituated is the fastest route to a disabled notification permission, and once it's off you never get it back. Offer it after the third session instead.
- **Quiet hours 21:00–07:00 local**, no exceptions including transactional.
- **One tap to unsubscribe** in every email, honoured immediately, no confirmation flow.
- **Ask for push permission late** — after the first stamp lands, not at install. Framed against a concrete benefit: *"Want to know the moment your stamp clears?"*
- Suppress any notification whose subject the user has blocked (§10 `blocks`).

---

## 18. Empty, loading, and error states

These are the screens a new user sees most and the ones no spec ever covers, so a developer invents copy you will hate. Voice rules from §2.2 apply: plain verbs, no metaphor in system messages, an empty screen is an invitation to act.

| Screen | Empty state |
| --- | --- |
| City Card card, 0 stamps | The full card outline with 5 empty slots, then: *“Buy a beverage at any Partner café and upload the receipt. After five verified visits, choose one eligible item free at a participating reward café.”* Below it, the 3 nearest partners by Match %. **This is your best pitch for the program — do not ship a blank rectangle.** |
| City List, empty | *"Nothing saved yet. Tap the bookmark on any cafe to keep it here."* |
| Regulars, empty | *"Your cafes will show up here once you've been."* |
| Awards, insufficient data | *"Not enough City Picks yet in this category."* Never a provisional rank. |
| Search, no results | *"No cafes match that."* Plus the 3 closest by name similarity. |
| Match feed exhausted | *"That's every cafe within 12 km. Widen the radius or change what you're after."* Plus both controls inline. |

| Situation | Error copy |
| --- | --- |
| Receipt OCR failed | *"Couldn't read that one. Try again with the whole receipt in frame and good light."* Retry button. Never blame the user's camera. |
| Receipt is a duplicate | *"This receipt has already been used for a stamp."* Flat statement, no accusation — the common case is an honest double-upload. |
| Already stamped this cafe | *"You've already stamped Kissa Nishi on this card. Try a different partner — here are 3 nearby."* Turn the error into the next action. |
| Location denied | *"Turn on location to see cafes near you, or search by neighbourhood."* Always give the non-location path. |
| Offline | *"You're offline. Your saved cafes and stamp card still work."* Cache both. |
| Magic link expired | *"That link expired. We'll send a new one."* Auto-send, don't make them retype the email. |

**Loading:** skeleton screens for the map and feed, never a spinner on a full screen. The Proximity Map has an explicit sequence (§8.2a) — staggered fade-in by distance — which doubles as the load state. Never show a Match % until the real number is ready; a number that changes after render destroys trust in every number.

---

## 18.5 Accessibility

Referenced once in §8.2a and nowhere else. Target **WCAG 2.2 AA**, and treat it as a build requirement rather than a later audit — retrofitting is several times the cost.

**The map problems, which are this product's specific ones:**

1. **The Proximity Map is a scatter plot of colour and position.** It is `aria-hidden`, and every café on it appears in an ordered text list directly below with name, Match %, distance, and reasons. The list is not a fallback — it is the primary representation, and the map decorates it. Build the list first.
2. **Colour is never the only signal.** Match bands on map pins (§8.3) carry a shape difference as well as a hue: filled for 85+, half-filled 70–84, outline below. A partner's striped pin edge is a texture, not a colour.
3. **Pink means match — and so does a label.** Anywhere `--blush` carries meaning, a text label carries it too. Roughly 8% of men have some form of colour vision deficiency, and red-green is the common one, which is precisely your blush-and-green palette.

**Everywhere else:**

- **Contrast** — all combinations in §4.2 pass AA. `--blush` and `--sky` are never text colours on light grounds; use the `-deep` variants.
- **Targets** — 44×44px minimum. Quiz options are large cards, not radio buttons, which helps everyone including people using the app one-handed holding a drink.
- **Keyboard** — the entire quiz, "Not it" loop, and the whole Café Portal are keyboard-operable. The Portal especially: it runs on a shared device at a counter and may be driven by whatever input the café has.
- **Screen readers** — Match % announces as *"94 percent match"*, not *"94%"*. Live regions for stamp approval and receipt status.
- **Motion** — `prefers-reduced-motion` disables all three sanctioned animations (§4.5) and renders end states immediately.
- **Text scaling** — layouts hold to 200% zoom. No fixed-height cards containing text.
- **Receipt upload** — the camera flow needs a file-picker alternative for anyone who can't frame a photo, and OCR failure copy must never assume the user did something wrong (§18).

**Hard filter, not a preference:** `wheelchair_access` is a hard filter in matching (§7.2), same class as dietary requirements. A step-free requirement excludes a café outright rather than down-ranking it, and the requirements screen (Appendix A) is where it's set.

---

## 18.6 Photo and content moderation

Members upload receipts and café photos; cafés upload menu text and images. Small surface, but unmoderated it's a liability.

| Content | Handling |
| --- | --- |
| **Receipt images** | Never public. Visible only to the uploader, the café in its queue, and admin. Purged at 30 days (§20). |
| **Member café photos** | Public. Auto-screened on upload; reportable; removable from admin. |
| **Personal notes on cafés** | Private to the author in v1. If they ever go public, they need the same pipeline as photos. |
| **Café-supplied images and menu text** | Trusted — a signed partner with a contract. Spot-check, don't screen. |

**Pipeline:** an automated NSFW/violence check on upload (Cloudflare Images or an equivalent classifier), auto-reject on high confidence, queue anything borderline. Report button on every public image. Human review inside 24h (§16) — at trial scale that is you, and an unattended queue is worse than no report button at all.

**Faces:** members photographing a café interior will capture other customers. Upload copy says so plainly — *"Please don't photograph other customers"* — and any reported image containing an identifiable stranger is removed on request without argument.

---

## 19. Analytics events

§9 lists metrics with nothing behind them. Match-to-visit conversion — the north star — is very hard to reconstruct after the fact. Instrument during the build.

PostHog. `snake_case`. Every event carries `user_id`, `session_id`, `timestamp`, `context` (the active context chip), and `is_member`.

```
ACTIVATION
  signup_started            { source }
  signup_completed
  quiz_question_answered    { q_index, choice }
  quiz_completed            { vector, duration_s }
  quiz_abandoned            { last_q_index }        ← tells you which question loses people
  proximity_map_viewed      { cafe_count }

MATCHING — the north star chain
  match_shown               { cafe_id, match_pct, rank, surface, reasons[] }
  match_opened              { cafe_id, match_pct }
  match_saved               { cafe_id, match_pct }
  match_rejected            { cafe_id, match_pct, reason }
  rejection_followup        { reason, answer }
  match_visited             { cafe_id, match_pct, days_since_shown }   ← THE METRIC

MENU
  menu_viewed               { cafe_id, item_count }
  menu_item_matched         { cafe_id, item_id, was_100 }

LOYALTY
  receipt_uploaded          { cafe_id }
  receipt_auto_approved     { cafe_id, latency_ms }
  receipt_queued            { cafe_id, failed_check }
  receipt_rejected          { cafe_id, reason }
  stamp_earned              { cafe_id, card_position }
  card_completed
  reward_redeemed           { cafe_id, days_to_complete }

HABIT
  app_opened                { had_purchase_intent }   ← habit signal, see 8.15
  weekly_drop_opened        { items_shown }

CAFE PORTAL
  portal_opened             { cafe_id, role }
  counter_viewed            { cafe_id, stamps_this_week }
  menu_submitted            { cafe_id, item_count, days_late }
```

**`match_visited` is the one that matters** and it needs a definition before build: a stamped receipt at a cafe shown as a match within the prior 30 days. Write that query first — if it's hard, the event schema is wrong and you want to know in week two, not month four.

**Set up the funnel on day one:** `quiz_completed → match_shown → match_opened → match_visited`. That single funnel tells you whether the entire product thesis is true.

---

## 20. Legal and compliance — **blocks signup, not launch day**

You are collecting emails, precise location, taste profiles, and **photographs of receipts** from Alberta residents. Alberta's PIPA applies. None of this is complex at your scale; all of it must exist before the first account is created.

**Required before the site accepts one email:**

| Document | Notes |
| --- | --- |
| **Privacy policy** | What you collect, why, retention periods, who sees it, how to delete. Must name receipt images specifically. |
| **Terms of service** | Includes the §5.1 firewall as a public commitment — make the honesty of the Match % contractual, not just a design principle. |
| **Cookie/consent banner** | Minimal analytics only. Decline-by-default for anything non-essential. |
| **Founding Partner agreement** | §21.3. One page. |

**Data-handling rules the build must implement:**

1. **Receipt images purge at 30 days** after resolution (§3.1f). Automated job, not a promise. Receipts carry names, card last-four, and sometimes addresses — they are the most sensitive thing you hold and the least useful to keep.
2. **Account deletion is a real, self-serve path.** Settings → Delete account → 30-day grace → hard delete. Anonymise rather than delete anything a café's aggregate stats depend on (matchups become `user_id = null`), but delete the profile, email, location history, and all receipt images outright.
3. **Location is never stored as a track.** Store the current query point for the request; never build a location history table. Nothing in this product needs one and it is the highest-risk data you could accumulate.
4. **Café Insights enforce a minimum cell size of 10** (§12.4). Below that, suppress rather than round.
5. **Export on request** — profile, taste vector, stamp history, matchups, as JSON. PIPA requires access; a button is cheaper than handling requests by hand.

**[DECIDE]** Get an Alberta small-business lawyer to review the privacy policy, terms, and founding agreement together. One session, and it covers everything above.

---

## 21. Café onboarding — the operational flow

The spec describes the Portal but never how a café gets into it. This is the flow you will run fifteen times in a month, so it needs to be tight.

### 21.1 The visit (~45 minutes, in person)

```
1. PITCH        (10 min)  Explain Listed vs Partner, the six-month
                          Founding offer, loyalty flow, and what payment
                          can never buy.
2. QUALIFY      ( 5 min)  Confirm location, menu category, decision-maker,
                          whether the café wants monthly reward redemption, operational capacity, and neighbourhood fit.
3. SIGN         ( 5 min)  Founding agreement on phone or paper.
4. SEED         (15 min)  Score the taste and space dimensions yourself.
                          Capture amenities, accessibility, hours, and
                          operational attributes.
5. SHOOT        (10 min)  One or two drinks plus interior and exterior.
                          Use consistent daylight and crop rules.
6. SET UP       (10 min)  Menu, City Card stamps, optional monthly reward
                          settings, portal access, staff contact, and weekly email.
```

**Do the vector yourself.** The owner's self-assessment is the least reliable input in the system — every café believes it is cosy, quiet, and welcoming. Their submission is a prior (§7.1), never the value.

### 21.2 First week

| Day | Action |
| --- | --- |
| 0 | Portal invite email: magic link, PIN, 2-minute Loom on approving receipts |
| 1 | Menu upload reminder — do the first one *with* them, over the phone |
| 3 | Confirm a test receipt flows end to end |
| 7 | First weekly counter email lands |

**Ship them a counter card and window decal in week one.** Physical presence in the café is what makes staff mention it to customers, and staff mentioning it is your entire in-store acquisition channel.

### 21.3 Founding Partner agreement — one page

Plain language, no legalese. It should be readable while standing at the counter.

```
BREW AND THE CITY — FOUNDING PARTNER

Your free period
  • Six months free from [START DATE] through [END DATE]
  • No setup fee and no payment method required to begin
  • The first 15 approved cafés only

What you receive
  • A complete Café Profile and honest Match %
  • A tagged menu with specific item recommendations
  • City Card stamp participation
  • Optional monthly free-item redemption
  • Café Portal access, weekly numbers, and a launch insight summary
  • One launch photo mini-session; the edited images are yours to reuse
  • One dedicated launch social feature plus relevant group roundups
  • Founding badge, counter card, window decal, and launch-event eligibility

What the café provides during the free period
  • Current menu, prices, hours, and one main contact
  • City Card stamps for verified beverage purchases
  • Review of flagged receipts within 72 hours
  • A short staff briefing and reasonable display of the counter card or decal

Optional monthly free-item redemption
  • The café chooses whether to participate each month
  • Submit 1–5 eligible items by the 25th for the following month
  • Eligible items may be beverages, pastries, small food items, or specials
  • The café chooses the items, quantities, valid hours, and monthly cap
  • Launch default maximum: 10 total redemptions per month
  • The approved base item is fully free to the member
  • Optional paid extras may be sold separately
  • The café may repeat the list or pause rewards for the next month

After the six months
  • Continue at $49/month, locked for 24 months; or
  • Upgrade to Featured if a slot is available; or
  • Return to a free Listed profile
  • On a paid plan, BREW AND THE CITY reimburses the agreed amount per
    verified redeemed item
  • No automatic surprise charge; a written reminder is sent first
  • Cancel the active partner plan with 30 days’ notice
  • Keep every approved photo already delivered

What money can never buy
  • A higher Match %, a better personalized rank, an award,
    or removal of another café.

Signed ______________________  Date __________
Primary contact ______________________________
City Card stamps:  Yes
Monthly reward redemption:  Opt in / Pause
Default monthly cap __________
```

The agreement should attach or link to the detailed Partner requirements in §3.0.4 and monthly reward-menu rules in §3.0.5. A lawyer should review the final version before use.


---

## 22. Seed data specification

The 60-café spreadsheet is your homework (§0.5), and it is also the CSV the admin console imports (§16). Same format, so build once.

```csv
name,slug,address,lat,lng,neighbourhood,phone,website,instagram,
drink_categories,price_band,hours_json,
drink_profile,energy,aesthetic,pace,adventure,price_tolerance,food_weight,
has_wifi,has_outlets,seating_count,has_outdoor,noise_level,
avg_wait_minutes,has_non_dairy,has_oat_milk,has_gluten_free,
wheelchair_access,has_food_program,takes_cash,
tier,stamps_enabled,rewards_opt_in,default_monthly_cap,reward_windows_json,notes
```

**Scoring discipline — this matters more than the tooling.**

- Score **in the room**, never from memory or from Instagram. A café's photos are its best hour; your vector needs its average hour.
- **Anchor on the extremes first.** Before scoring 60, find the loudest café in Calgary and the quietest, and call them 95 and 5. Everything else is placed between two real reference points instead of against an abstraction. Do this for all 7 dimensions — it is 20 minutes and it is the difference between a usable dataset and noise.
- **Visit at the same time of day** where possible. A café at 8am and 3pm are different rooms.
- **Re-score your first five** after you have done all sixty. Your calibration will have drifted, and the first five will be wrong.

**Validation before import:** every dimension 0–100, no dimension where all 60 cafés sit within 20 points of each other (that dimension is doing no work and needs re-scoring), and lat/lng inside Calgary city limits.

---

## 23. Launch sequence — getting the first 200 members

**This is the public launch, not the pre-launch phase.** By "Week −2" below, §0.4's no-account site has already been collecting emails and survey answers for weeks — this sequence is how that waitlist, plus the onboarded café staff, convert into the first 200 real accounts once there's an app to sign up for.

The build phases (§14) say how to make it. Nothing in this document says how to get anyone to use it, and for a trial whose entire purpose is traction, that is the larger risk.

**The chicken-and-egg is smaller than it looks** — the app is useful to a single user on day one because matching does not require other members. Layer 2 is off (§0.5). So this is straightforward acquisition, not a marketplace cold-start.

| Phase | Channel | Target |
| --- | --- | --- |
| **Week −2** | Partner staff. 15 cafés × ~6 staff, all onboarded before launch. They are your first users and your in-store salespeople. | 60 |
| **Week 0** | One email to everyone who joined the pre-launch waitlist (§0.4) — "it's live" — since that's the one thing they were ever promised. | size of the list |
| **Week 0** | Counter cards + window decals in 15 cafés. QR to the quiz. | ongoing |
| **Week 0** | Personal Instagram + the partner cafés resharing the launch post | 40 |
| **Week 1–4** | The quiz as the shareable object. The Proximity Map with your name on it is the post — it is a personal result, which is the only kind of thing people share. | 60 |
| **Week 2** | UCalgary and SAIT — study-spot angle, campus subreddits, student groups. Deep-work context is the strongest hook for this audience. | 40 |
| **Week 4+** | The awards story (§8.2b) to Avenue Calgary, CBC Calgary, the Herald | organic |

**Get partner staff onboarded before launch, without exception.** A barista who has taken the quiz and has their own card will mention it unprompted, twenty times a shift, for free. This is the highest-leverage hour in the entire launch and it costs nothing.

**The shareable object is the Proximity Map, not the app.** Generate a 1080×1080 PNG server-side (§8.2a) with the person's dot, their top 3, and a small wordmark. People share results about themselves; nobody shares an app.

**Do not run paid ads during the founding launch period.** You are testing whether the product earns attention. Paid acquisition would mask exactly the signal you are trying to read.

---

## 24. Content operations

The founding offer promises **one launch feature and one mini-shoot per café**, plus relevant group coverage. It does not promise 15 dedicated posts every month. This is still an operational system and needs a schedule before the first café signs.

**Six-month founding commitment:**

- 15 onboarding mini-shoots, completed during café setup;
- 15 dedicated launch features, normally one per Founding Partner;
- approximately 2–4 group roundups per month across the whole network;
- seasonal and weekly-drop inclusion when the café is genuinely relevant;
- ongoing content for Featured cafés only, capped at eight.

A realistic launch cadence:

```
WEEK 1   Onboard and photograph 2–3 cafés.
WEEK 2   Edit the next launch features and one group roundup.
WEEK 3   Onboard and photograph 2–3 cafés.
WEEK 4   Schedule, report, and leave room for seasonal content.
```

**Rules that keep it deliverable:**

- **Use the onboarding shoot twice.** It supplies both the Café Profile and the café’s launch feature.
- **Bank content before launch.** Do not announce the network until at least the first five café features are edited.
- **Use one photo preset and crop system.** Consistency across the app matters more than custom styling for each café.
- **Group features carry ongoing visibility.** A neighbourhood guide can serve several cafés without becoming a monthly agency retainer.
- **Only Featured promises recurring custom content.** Founding and Partner cafés receive defined inclusions, not unlimited creation.
- **Track every promised deliverable.** Store café, due date, asset status, approval status, and publication link in the operating tracker.
- **Set approval deadlines.** If a café does not approve within three business days, the slot may move rather than blocking the calendar.

This model is intentionally smaller than the earlier Featured-for-everyone proposal. It gives the first 15 a meaningful launch package without creating a promise the founder cannot sustain.

---

## 25. Engineering conventions

A developer will ask all of this on day one.

**Environments:** `local` → `preview` (Vercel per-PR) → `production`. One Supabase project per environment; never point preview at production data.

**Secrets** (all server-side, never `NEXT_PUBLIC_` except the first two):
```
NEXT_PUBLIC_SUPABASE_URL          NEXT_PUBLIC_MAPBOX_TOKEN
SUPABASE_SERVICE_ROLE_KEY         OCR_PROVIDER_KEY
RESEND_API_KEY                    REWARD_JWT_SECRET
POSTHOG_KEY                       ADMIN_ALLOWLIST
```

**Migrations:** Supabase CLI, checked into the repo, forward-only. Never edit a shipped migration. A `seed.sql` loads the 60-café CSV so any developer can get a working local database in one command — this matters more than it sounds, because the app is meaningless without café data.

**Repo layout:**
```
app/(marketing)   app/(app)   app/(portal)   app/(admin)   app/api/
lib/matching/     lib/receipts/   lib/loyalty/   lib/db/
components/ui/    components/    supabase/migrations/
```

Four route groups because they have four different layouts, audiences, and auth rules. Keep them separate from the first commit; splitting them later is painful.

**Tunables live in `lib/matching/constants.ts` and nowhere else** — layer weights, τ, shrinkage `m`, Elo `K`, display floor/ceiling, radius defaults, reward cap. You will retune constantly after launch and you should never be grepping for a number.

### 25.1 Acceptance criteria — how you know it's done

Most of the spec is prose. These are the things a build can actually be tested against.

**The firewall (§5.1) — make the violation fail CI:**
```
test: a Listed café and a Partner café with identical vectors,
      identical attributes, identical distance
      → identical Match %.
test: lib/matching/ imports nothing from cafe_subscriptions.
```

**Matching:**
- Appendix B reproduces to **88%** exactly, and to 86% with τ = 3.0
- Every returned match carries 1–3 reasons; a match with zero reasons is a failing test
- Displayed % never below 40, never above 98, and 100 only when a qualifying menu item exists
- Context override changes results — assert the Café A/B case from §7.5 directly

**Loyalty:**
- Same receipt twice → second is rejected on `dedupe_hash`
- 3rd stamp attempt at the same café on one card → blocked (§3.1a.1), with two alternates returned
- 5 stamps → card completes → reward issuable exactly once
- Queued receipt untouched for 72h → auto-approves
- Reward JWT: expired, replayed, or wrong café → all rejected

**Privacy:**
- Receipt images older than 30 days are gone
- Account deletion removes profile, email, and receipt images; leaves anonymised matchups
- Insights suppress any cell under 10

**Performance:** match scoring for one user across 200 cafés under 50ms server-side. It's a loop over 200 seven-element vectors — if it's slower, something is wrong, most likely an N+1 query.

---

## 26. Runbook and risk register

### 26.1 When things break

| Situation | Action |
| --- | --- |
| OCR provider down | Feature flag → every receipt routes to the café queue. Members see "we're checking this by hand, your stamp will land within a day." Never drop a receipt. |
| A café's auto-approve rate drops below 80% | Merchant string changed (new POS, renamed location). Fix it in admin (§16); do not ask the café to work a queue. |
| Café disputes an approved stamp | Honour the member's stamp, log the dispute against the member. Three disputes → manual review. Never claw back a stamp; the $4 is not worth the trust. |
| Café wants to leave mid-trial | Let them, same day, no friction. Ask one question: what would have made it worth staying? Write the answer down. |
| Report of abuse | 24h SLA, human review (§16). |
| Reimbursement ceiling hit after paid conversion | Rewards queue to next month with a plain message. Never silently fail a redemption at the counter. |

### 26.2 What actually kills this

| Risk | Severity | Mitigation |
| --- | --- | --- |
| **Cafés won't pay after the trial** | Fatal | Signed founding agreements up front (§3.0.2) — this converts the risk into a month-two signal instead of a month-twelve surprise |
| **Content promise collapses** | High | Batch, bank a month ahead, downgrade the promise honestly (§24) |
| **Vectors are wrong, matches feel random** | High | Anchor scoring on extremes, test in Sheets before building (§22, §0.5) |
| **Receipt friction kills the loyalty loop** | High | Auto-approve 85–90%, 72h auto-clear, never block on a café |
| **You burn out** | High | The trial costs ~$40/mo but a large share of your week. Scope it: 15 cafés, one city, a stated end date. |
| **Nobody opens it weekly** | Medium | The Monday drop (§8.15). Instrument `app_opened` with intent from day one. |
| **A café demands paid placement** | Medium | §3.1b.2. The answer is no, and losing that café is cheaper than losing the premise. |
| **Winter flattens everything** | Medium | Seasonal τ (§7.4a), double-stamp January campaign, expect a Q1 dip and don't misread it as failure |

### 26.3 The one-sentence test

> If a Calgarian takes the quiz, gets three cafés, goes to one, and thinks *"that was a good call"* — everything else in this document is an implementation detail. If they don't, nothing else in this document matters.

Protect that sentence in every trade-off.

---

## Appendix A — The quiz **[REWRITTEN v3.1]**

**9 questions. 4 options each. Single-select. No skipping.**

Question 1 captures the user’s primary drink category. Question 2 adapts to that category and seeds the sweet-to-bold `drink_profile` axis. Questions 3–8 seed the remaining six vector dimensions. Question 9 sets travel radius and `worth_the_trip`.

Four options rather than two is a real improvement: a binary forces people into a corner they do not occupy, and everyone lands at the extremes. Four choices across the seven scored dimensions still produce 16,384 distinct taste vectors; drink category and radius add useful preference signals without distorting those vectors.

All seven vector dimensions start at 50. Q1 is categorical and applies no delta. Q2–Q8 apply the listed delta and clamp the affected dimension to 0–100. Q9 sets distance preferences directly.

---

**Q1 — What’s your go-to café drink?** → `primary_drink_category` **[NEW v3.1]**

| | Option | Saved value |
| --- | --- | --- |
| A | **Coffee** — espresso, lattes, cappuccinos, cold brew or filter coffee | `coffee` |
| B | **Matcha** — matcha lattes, flavoured matcha or traditional matcha | `matcha` |
| C | **Tea or chai** — chai lattes, brewed tea, London fogs or tea lattes | `tea_chai` |
| D | **Refreshers and other drinks** — fruit refreshers, lemonades, sparkling drinks or caffeine-free options | `refreshers_other` |

Q1 is a category preference and menu-availability filter, not a taste-vector score. Save it on the user profile and use it to decide which café menus and named drink recommendations are relevant.

**Q2 — How do you usually like your drink?** → `drink_profile` **[ADAPTIVE v3.1]**

Show one version of the answers based on Q1. The answer positions always use the same deltas so `drink_profile` remains comparable across categories.

**If Q1 = Coffee**

| | Option | Δ |
| --- | --- | --- |
| A | Sweet and flavoured — vanilla, caramel or mocha | −35 |
| B | A lightly sweetened latte | −10 |
| C | An unsweetened latte or cappuccino | +15 |
| D | Black coffee or straight espresso | +40 |

**If Q1 = Matcha**

| | Option | Δ |
| --- | --- | --- |
| A | Sweet and flavoured — strawberry, vanilla or coconut | −35 |
| B | A lightly sweetened matcha latte | −10 |
| C | An unsweetened matcha latte | +15 |
| D | Straight matcha or usucha | +40 |

**If Q1 = Tea or chai**

| | Option | Δ |
| --- | --- | --- |
| A | Sweet and creamy — chai or a flavoured tea latte | −35 |
| B | Lightly sweetened with milk | −10 |
| C | Plain tea with a little milk | +15 |
| D | Straight brewed tea with nothing added | +40 |

**If Q1 = Refreshers and other drinks**

| | Option | Δ |
| --- | --- | --- |
| A | Sweet and fruity | −35 |
| B | Lightly sweetened and refreshing | −10 |
| C | Tart, citrusy or sparkling | +15 |
| D | Unsweetened and simple | +40 |

**Q3 — What kind of room do you want to walk into?** → `energy`

| | Option | Δ |
| --- | --- | --- |
| A | Silent — everyone has headphones on | −35 |
| B | A low hum, but mostly quiet | −12 |
| C | Busy, but I can still hear myself | +15 |
| D | Packed — music up and people talking | +38 |

**Q4 — How long are you staying?** → `pace`

| | Option | Δ |
| --- | --- | --- |
| A | In and out — under ten minutes | −38 |
| B | About half an hour | −12 |
| C | An hour or two | +18 |
| D | Until they start stacking chairs | +40 |

**Q5 — What should the café look like?** → `aesthetic`

| | Option | Δ |
| --- | --- | --- |
| A | Concrete, steel and one plant | −35 |
| B | Light wood, minimal and Japandi | −12 |
| C | Warm, plants and mismatched chairs | +18 |
| D | Maximal — records, art and happy clutter | +38 |

**Q6 — How adventurous are you at the counter?** → `adventure`

| | Option | Δ |
| --- | --- | --- |
| A | I order the same thing every time | −35 |
| B | I rotate between two or three favourites | −10 |
| C | I choose whatever looks good that day | +15 |
| D | I always try the new seasonal drink | +38 |

**Q7 — How much is a drink worth to you?** → `price_tolerance`

| | Option | Δ |
| --- | --- | --- |
| A | Under $5, or I’m making it at home | −38 |
| B | Around $6 feels normal | −10 |
| C | I’ll pay $8 if it’s genuinely good | +18 |
| D | I don’t really check the price | +38 |

**Q8 — Is food part of the plan?** → `food_weight`

| | Option | Δ |
| --- | --- | --- |
| A | I’m only here for the drink | −35 |
| B | I might get a pastry | −8 |
| C | The pastry case matters | +20 |
| D | If there’s no real food, I’m not going | +38 |

**Q9 — How far will you go?** → `max_radius_m` + `worth_the_trip`

| | Option | Effect |
| --- | --- | --- |
| A | Walking distance only | 1,500 m |
| B | A short drive — around ten minutes | 6,000 m |
| C | Anywhere in the city | 15,000 m |
| D | I’ll drive across town for a great café | 25,000 m, `worth_the_trip = true` |

Q9 feeds the proximity layer (§7.4a) directly. `worth_the_trip` also raises the “worth the drive” suggestion cap from 1 to 3.

---

### After the quiz — the requirements screen

Not a quiz question. One screen, multi-select, skippable, immediately after Q9:

> **Anything we should filter out?**
> □ I need non-dairy options · □ Gluten-free · □ Step-free access · □ None of these

These become **hard filters** (§7.2), not dimensions. Keeping them out of the quiz proper means the nine questions stay focused on drink preference, café fit, and practical distance without stalling on an accessibility question early in the flow.

### Design notes for the build

- **Q2 is conditional UI.** Render only the answer set associated with Q1; do not show all four drink-category tables to the user.
- **Persist Q1 immediately.** If the quiz is interrupted, `primary_drink_category` is already available for menu ordering and content personalization.
- **Image pairs are placeholders in the spec, not assets.** Each option needs a real photograph or illustration. Photography of actual Calgary cafés beats stock by a wide margin — and shooting it is a reason to be in fifteen cafés talking to owners.
- **Progress dots, not a bar.** Nine dots still reads as short; a bar at 11% reads as long.
- **No back button between questions**, but a “start over” on the result screen. Back buttons invite second-guessing and inflate abandonment.
- **Target completion time: under 75 seconds.** Instrument `quiz_abandoned` with `last_q_index` (§19) — if a specific question loses people, rewrite that question rather than shortening the quiz.
- **A/B the copy after launch, not the structure.** Seven scored dimensions, one drink-category preference, and one radius question are the minimum needed to produce a useful café match without forcing unlike signals onto the same axis.

---

### The reveal — top 3 **[v1.7]**

The quiz resolves to the Proximity Map (§8.2a) with **exactly three cafes named**, ranked, plus a "worth the drive" entry if one qualifies.

```
┌──────────────────────────────────────┐
│        bold & unsweetened                 │
│                 │   ○ Monogram              │
│   quiet ────────┼──────────── loud       │
│                 │ ● You                     │
│      ○ Rosso    │    ○ Sought x Found       │
│          sweet & creamy                    │
├──────────────────────────────────────┤
│  1  Monogram Bankview          94%  1.2km │
│     Order the Ceremonial Latte, $6.50      │
│     Quiet, unsweetened, outlets everywhere │
│                                            │
│  2  Rosso Inglewood            89%  2.8km │
│  3  Sought x Found             86%  3.1km │
│                                            │
│  ── Worth the drive ──                     │
│     Kissa Nishi                93%  11km  │
│                                            │
│  [ Save these — sign up free ]             │
└──────────────────────────────────────┘
```

**Why three and not five or ten.** Three is the largest set a person can hold in their head and choose between without deferring the decision. Ten results is a search engine, and a search engine is what they were already using. Three is an answer.

**Rules:**
- **#1 gets full treatment** — the menu item by name and price, all three match reasons. #2 and #3 get name, percentage, and distance only. Expanding either promotes it to full treatment.
- **Distance always visible** on every result. Proximity is a scored term now (§7.4a) and hiding the input to a score people are judging is how you lose their trust.
- **"Worth the drive" is separate and clearly divided**, never mixed into the ranked three.
- **Refresh gives a different three**, never a reshuffle of the same three. Free tier: 3 refreshes/day.
- Below the three: *"Not it?"* (§8.2d) and *"See all 60 on the map."*

## Appendix B — Worked matching example **[UPDATED v1.9]**

Four layers, v1.7 weights (§7.5). Use this to verify an implementation.

**User:** finished quiz, 8 cafés ranked, 3 friends → row 4 of the weight table:
`wC = 0.37, wT = 0.26, wP = 0.20, wS = 0.17`

```
User vector   [drink 72, energy 28, aesthetic 40, pace 78,
               adventure 55, price 65, food 35]
Location      Kensington
Context       Deep work → overrides energy → 15, pace → 90
Season        August → τ = 5.0
```

**Cafe:** Kissa Nishi — 1.9 km away
```
Cafe vector   [drink 80, energy 25, aesthetic 35, pace 85,
               adventure 45, price 70, food 30]
Attributes    wifi ✓  outlets ✓  seating 18 ✓   → passes Deep work filters
Menu          "Ceremonial Latte" — grassy, unsweetened, oat default
```

**Layer 1 — TasteFit** (unmodified user vector, weights from §7.2)
`d ≈ 22.4`, `d_max ≈ 264.6` → **91.5**

**Layer 2 — SocialProof**
2 friends ranked it. Friend A (sim 0.94) percentile 88; Friend B (sim 0.61) percentile 74.
`raw = (0.94·88 + 0.61·74) / (0.94+0.61) = 82.5`
Shrinkage `m = 3`, `μ = 71`: `(2·82.5 + 3·71) / 5` → **75.6**

**Layer 3 — ContextFit** (context-overridden vector)
`d ≈ 18.9` → **92.9**

**Layer 4 — ProximityFit** (§7.4a)
`d = 1.9 km`, above the 1.0 km plateau
`100 · exp(-(1.9 - 1.0) / 5.0) = 100 · exp(-0.18)` → **83.5**

**Combined**
```
0.37(92.9) + 0.26(91.5) + 0.20(83.5) + 0.17(75.6)
=  34.4    +   23.8     +   16.7     +   12.9      = 87.8  →  88%
```

**Does it reach 100%?** No. The menu contains a matching item, but 100% requires passing every hard filter *and* an item matching on every expressed dimension (§8.2c). This user's `drink_profile` is 72 — grassy-leaning but not at the ceiling — and the Ceremonial Latte is tagged fully unsweetened. Close, not exact. Displays as **88%**, with the item named.

**Same cafe in January** (`τ = 3.0`):
`ProximityFit = 100 · exp(-0.9/3.0) = 74.1` → combined **86%**
A 2-point winter penalty at 1.9 km, growing sharply with distance — a 6 km cafe drops 12 points over the same seasonal change.

**Reasons shown:**
- "Good for deep work — wifi, outlets, and room to sit"
- "Matches your taste for lingering"
- "2 friends with taste like yours rate this highly"

---

*End of spec v3.6.*
