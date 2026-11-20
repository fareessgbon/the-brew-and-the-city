// Seeds the `cafes` table from the placeholder CAFES list below. One-time
// bootstrap for early development against a fresh Supabase project — app
// code always reads from Supabase directly, never from this file.
//
// Deliberately NOT setting latitude/longitude/address/opening_hours: those
// would be fabricated if invented here, and the whole point of the earlier
// "sample data" disclosure work was to stop presenting invented specifics as
// real. Real geocoding is build step 10 (Mapbox), pending an API key.
//
// Usage: DATABASE_URL=postgresql://postgres:<password>@... node scripts/seed-cafes.mjs

import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set DATABASE_URL before running this script.');
  process.exit(1);
}

const CAFES = [
  { id: 'monogram', name: 'Monogram', slug: 'monogram', city: 'calgary', area: 'Mission', isPartner: true, vector: { drink: 78, energy: 22, aesthetic: 30, pace: 75, adventure: 40, price: 70, food: 35 } },
  { id: 'rosso', name: 'Rosso Coffee Roasters', slug: 'rosso', city: 'calgary', area: 'Mission', isPartner: false, vector: { drink: 35, energy: 55, aesthetic: 40, pace: 45, adventure: 30, price: 45, food: 60 } },
  { id: 'soughtxfound', name: 'Sought x Found', slug: 'sought-x-found', city: 'calgary', area: 'Inglewood', isPartner: true, vector: { drink: 60, energy: 68, aesthetic: 70, pace: 45, adventure: 60, price: 55, food: 50 } },
  { id: 'philseb', name: 'Phil & Sebastian', slug: 'phil-and-sebastian', city: 'calgary', area: 'Kensington', isPartner: false, vector: { drink: 55, energy: 58, aesthetic: 50, pace: 40, adventure: 40, price: 60, food: 45 } },
  { id: 'analog', name: 'Analog Coffee', slug: 'analog', city: 'calgary', area: 'Beltline', isPartner: true, vector: { drink: 70, energy: 35, aesthetic: 35, pace: 65, adventure: 45, price: 60, food: 25 } },
  { id: 'fratello', name: 'Fratello', slug: 'fratello', city: 'calgary', area: 'Downtown', isPartner: true, vector: { drink: 45, energy: 50, aesthetic: 45, pace: 45, adventure: 35, price: 40, food: 40 } },
  { id: 'heritage', name: 'Calgary Heritage Roasting', slug: 'calgary-heritage-roasting', city: 'calgary', area: 'Inglewood', isPartner: true, vector: { drink: 50, energy: 45, aesthetic: 55, pace: 50, adventure: 50, price: 50, food: 45 } },
  { id: 'paradigm', name: 'Paradigm Spark', slug: 'paradigm-spark', city: 'calgary', area: 'Beltline', isPartner: true, vector: { drink: 65, energy: 60, aesthetic: 65, pace: 40, adventure: 70, price: 65, food: 55 } },
  { id: 'eightounce', name: 'Eight Ounce Coffee Club', slug: 'eight-ounce-coffee-club', city: 'calgary', area: 'Bridgeland', isPartner: true, vector: { drink: 50, energy: 40, aesthetic: 60, pace: 55, adventure: 55, price: 50, food: 30 } },
  { id: 'deville', name: 'Deville Coffee', slug: 'deville', city: 'calgary', area: 'Downtown', isPartner: false, vector: { drink: 40, energy: 65, aesthetic: 35, pace: 35, adventure: 25, price: 45, food: 50 } },
  // Sourced from theandsome.com (2026-08-23) — flower shop + café + bakery
  // hybrid, 540 7 Ave NW, Kensington. Vector is this session's read of the
  // menu/site copy (Korean-café style: injeolmi/black sesame/rose/lavender
  // lattes, a "Cloud Series," croffles, high tea), not a survey response —
  // flag for a real taste-vector survey once they're approached as a partner.
  { id: 'andsome', name: 'And Some', slug: 'and-some', city: 'calgary', area: 'Kensington', isPartner: false, vector: { drink: 22, energy: 60, aesthetic: 85, pace: 60, adventure: 78, price: 62, food: 72 } },
  // Sourced from mypiknic.square.site + mypiknic.ca (2026-08-23) — Korean-
  // inspired sandwich café. Address confirmed directly on mypiknic.ca's own
  // Contact page: 255 Brentwood Pl NW, Calgary, AB T2L 2M5 (the postal code
  // a Yelp listing gave, T2L 1K8, doesn't match this and was dropped —
  // trust the business's own page). Brentwood (near U of C).
  // "Fresh, budget-friendly options for takeout, delivery, and catering" is
  // the business's own framing — counter-service, not a linger-and-work
  // spot, hence the low pace/aesthetic here relative to the other entries.
  // Brentwood isn't in the walkable-core chip strip HomeContent.tsx used to
  // show (removed — see components/HomeContent.tsx), so this café was never
  // gated by that; not a bug. Vector is this session's read, not a survey
  // response — same flag as And Some above.
  { id: 'mypiknic', name: 'My Piknic', slug: 'my-piknic', city: 'calgary', area: 'Brentwood', isPartner: false, vector: { drink: 40, energy: 45, aesthetic: 25, pace: 20, adventure: 55, price: 25, food: 80 } },
  // Sourced from uncommondrip.com (2026-08-23) — hip-hop-themed sandwich +
  // coffee spot, 802 Edmonton Trail NE. Their own site gives only the
  // address, not a neighbourhood — Edmonton Trail is literally the
  // Bridgeland/Crescent Heights/Renfrew boundary line here, so "Bridgeland"
  // is corroborated rather than certain: a real estate listing calls the
  // block "Bridgeland," and Daily Hive independently described Diner
  // Deluxe next door (804 Edmonton Trail NE) as a "Bridgeland location."
  // Wood-fired sandwiches, "bold" specialty coffee, custom-syrup "Dirty Pop" drinks,
  // DJ every Saturday morning — high-energy daytime spot (7:30am–4pm daily,
  // not an evening hangout). Vector is this session's read, not a survey
  // response — same flag as the other two entries above.
  { id: 'uncommondrip', name: 'Uncommon Drip', slug: 'uncommon-drip', city: 'calgary', area: 'Bridgeland', isPartner: false, vector: { drink: 55, energy: 80, aesthetic: 60, pace: 45, adventure: 70, price: 55, food: 75 } },
  // Sourced from semanticscafe.com (2026-08-23) — "a hub for Calgary
  // creatives across all mediums," 1010 1st St SE. Their own site gives
  // only the address, not a neighbourhood; "Beltline" is corroborated by
  // two other addresses on the same block of 1st St SE (1001 and 1100)
  // that are each independently documented as Beltline, sandwiching this
  // one between them. Specialty coffee, a rotating
  // alcohol selection, books and vinyl for sale, open mic nights (2nd/4th
  // Monday) with a full PA, performance/rehearsal space. Food isn't a
  // stated part of the offering, hence the low food score. Vector is this
  // session's read, not a survey response — same flag as the others above.
  { id: 'semantics', name: 'Semantics Cafe', slug: 'semantics-cafe', city: 'calgary', area: 'Beltline', isPartner: false, vector: { drink: 50, energy: 70, aesthetic: 65, pace: 70, adventure: 75, price: 50, food: 30 } },
  // Sourced from alforno.ca (2026-08-23) — bakery/café/restaurant, this
  // entry is the primary/original location (222 7 St SW, Eau Claire); the
  // business actually runs 7 Calgary locations plus a Canmore opening,
  // which a real profile would need to pick one of or model separately.
  // Full bakery + brunch/lunch/dinner + $45/person afternoon tea + wine/
  // beer/cocktails — moderate-to-upscale ($4–$30+), food-forward rather
  // than a coffee-and-laptop spot. Eau Claire, same as My Piknic's
  // Brentwood above, was never in that now-removed chip strip — expected,
  // not a bug. Vector is this session's read, not a survey response.
  { id: 'alforno', name: 'Alforno Bakery and Café', slug: 'alforno', city: 'calgary', area: 'Eau Claire', isPartner: false, vector: { drink: 30, energy: 60, aesthetic: 65, pace: 70, adventure: 35, price: 70, food: 85 } },

  // ---------------------------------------------------------------------
  // Toronto — second market, added 2026-09-18. Same standard as every
  // Calgary entry above: real businesses, addresses/neighbourhoods sourced
  // from the business's own site (not third-party aggregators, which
  // disagreed with each other and with the business's own "Locations" page
  // more than once during this research pass — e.g. two unrelated roasters
  // both nominally "at" 983 Queen St E per stale listings; dropped rather
  // than guess which one's current). Vectors are this session's read of
  // each site's own copy, not a survey response — same flag as every
  // Calgary vector-only entry above.
  // ---------------------------------------------------------------------
  // Sourced from pilotcoffeeroasters.com (2026-09-18) — "Locations" page
  // lists the Ossington café at 117 Ossington Avenue, Ossington. Roastery
  // + specialty coffee brand ("Coffee at Its Full Potential"); own copy
  // describes nuanced, approachable medium-range roasting (Heritage/Academy
  // blends, single-origin limited releases), spaces "designed for
  // community connection" and "coffee appreciation" (tastings, latte-art
  // classes) rather than a laptop-and-linger spot, mid-to-premium pricing
  // ($22–25/bag), and a coffee-lifestyle retail focus (beans, brew gear,
  // merch) with no real food program.
  { id: 'pilot', name: 'Pilot Coffee Roasters', slug: 'pilot-coffee-roasters', city: 'toronto', area: 'Ossington', isPartner: false, vector: { drink: 58, energy: 45, aesthetic: 45, pace: 40, adventure: 55, price: 62, food: 20 } },
  // Sourced from matchamatcha.ca (2026-09-18) — "Locations" page lists the
  // flagship at 407 Church Street, Church-Wellesley. Ceremonial-grade Kyoto
  // matcha specialist — own menu copy leans heavily sweet/flavoured
  // (Strawberry, Vanilla Bean, Black Caramel, Tokyo Fog, BLU, matcha soft
  // serve) rather than plain/unsweetened, described by third-party coverage
  // as a "modern, Instagram-worthy" spot, plus a real bakery case (bagels,
  // croissants, roll cakes, tiramisu). Toronto's counterpart to Calgary's
  // And Some, drink-category-wise.
  { id: 'matchamatcha', name: 'Matcha Matcha', slug: 'matcha-matcha', city: 'toronto', area: 'Church-Wellesley', isPartner: false, vector: { drink: 18, energy: 68, aesthetic: 85, pace: 45, adventure: 80, price: 55, food: 60 } },
  // Sourced from samjamescoffeebar.com (2026-09-18) — "Locations" page
  // lists the original café at 297 Harbord St, Little Italy (per the site's
  // own neighbourhood label). Own copy describes the roast as "sweet,
  // chocolatey, and consistent... caramel sweetness, chocolate depth,"
  // sourced/roasted for approachability over intensity; no seating or food
  // detail given beyond the separate Parkdale location's bread partnership,
  // consistent with these being small counter-service bars rather than
  // work-and-linger cafés.
  { id: 'samjames', name: 'Sam James Coffee Bar', slug: 'sam-james-coffee-bar', city: 'toronto', area: 'Little Italy', isPartner: false, vector: { drink: 42, energy: 42, aesthetic: 35, pace: 30, adventure: 45, price: 55, food: 25 } },
  // Sourced from darkhorseespresso.com (2026-09-18) — "Locations" page
  // lists the original Queen East café at 630 Queen St E, labelled
  // Riverside/Leslieville on the site's own list. Own copy: "real
  // friendships" with regulars, a casual "Sip + Slurp" tasting series,
  // single-origin specialty coffee alongside a ceremonial-grade Kyoto
  // matcha program, and a real lunch menu (made-in-house sandwiches,
  // seasonal pastries) — the most food-forward and social of the five
  // Toronto entries.
  { id: 'darkhorse', name: 'Dark Horse Espresso Bar', slug: 'dark-horse-espresso-bar', city: 'toronto', area: 'Riverside', isPartner: false, vector: { drink: 58, energy: 62, aesthetic: 55, pace: 60, adventure: 60, price: 55, food: 65 } },
  // Sourced from moonbeancoffee.com (2026-09-18) — confirms 30 St. Andrew
  // St, Kensington Market. Microroaster and café operating since 1995,
  // ethical/sustainable sourcing as the stated core philosophy, a range
  // from lighter single-origins (Ethiopian Yirgacheffe, Kenyan) to a
  // dedicated dark roast rather than one house style. Toronto's counterpart
  // to Calgary's Semantics Cafe, neighbourhood-and-vintage-wise: a
  // long-running independent institution in the same arts-and-market
  // district, not a new or polished build-out.
  { id: 'moonbean', name: 'Moonbean Coffee Company', slug: 'moonbean-coffee-company', city: 'toronto', area: 'Kensington Market', isPartner: false, vector: { drink: 55, energy: 50, aesthetic: 55, pace: 65, adventure: 45, price: 40, food: 35 } },
  // Sourced from 10dean.ca (2026-09-19) — UNCONFIRMED, pending the café's
  // own confirmation by email. "Specialty café and cocktail bar," four
  // Toronto locations (Waverley, Parker, Elm, Sloane); this entry is the
  // Waverley one, 484 Spadina Avenue (Spadina), the first listed on their
  // Locations page and the pickup point on their online menu. "Coffee by
  // Day, Cocktails by Night," open 7am–9pm (10pm Fri/Sat) at Waverley,
  // seasonal handcrafted drinks, sandwiches and baked goods, events and
  // workshops. Menu prices seen: lattes $6–8, drip $3.75–4.75, single
  // origin matcha with house syrups. Vector is this session's read of that
  // copy, not a survey response — same flag as every entry above.
  { id: 'tendean', name: '10 DEAN', slug: '10-dean', city: 'toronto', area: 'Spadina', isPartner: false, vector: { drink: 40, energy: 60, aesthetic: 65, pace: 65, adventure: 75, price: 60, food: 55 } },
  // Sourced from contracafe.ca (2026-09-19) — UNCONFIRMED, pending the
  // café's own confirmation. The site is a bare contact page: 1028 Shaw St,
  // Toronto, Mon–Fri 7:30–5, Sat–Sun 8–5, no menu and no copy. Every score
  // is therefore left at the neutral 50 rather than guessed — the site's
  // own "unscored" state (isUnscored in lib/data/cafeFields.ts) — until
  // they answer the taste-vector survey. The site doesn't name a
  // neighbourhood, so "area" is the street.
  { id: 'contra', name: 'Contra Cafe', slug: 'contra-cafe', city: 'toronto', area: 'Shaw Street', isPartner: false, vector: { drink: 50, energy: 50, aesthetic: 50, pace: 50, adventure: 50, price: 50, food: 50 } },
  // Sourced from breadycafe.com (2026-09-19) — UNCONFIRMED, pending the
  // café's own confirmation by email. "Contemporary European" bakehouse and
  // café: breads, pastries, cakes, salads, brunch, paninis, espresso, all
  // "handmade daily." Four locations — York & Adelaide (130 King St W),
  // Yonge & Eglinton (2433 Yonge St), Concord and Vaughan Mills; the last
  // two are outside Toronto proper. This entry is York & Adelaide, first on
  // their Locations page (Mon–Fri 7am–8pm, Sat–Sun 8am–8pm), Financial
  // District. Menu leans heavily to food (croissant benedict, salads,
  // panini, cube croissants) with a matcha latte and espresso alongside, so
  // food is high and drink is a coffee-shop middle. Vector is this session's
  // read of that copy, not a survey response.
  { id: 'bready', name: 'Bready Cafe', slug: 'bready-cafe', city: 'toronto', area: 'Financial District', isPartner: false, vector: { drink: 50, energy: 58, aesthetic: 60, pace: 55, adventure: 40, price: 55, food: 90 } },
  // Sourced from hellodemello.com (2026-09-19) — UNCONFIRMED, pending the
  // café's own confirmation by email. Toronto roastery-and-café chain; own
  // story: founded by two brothers who opened "a small café and roaster in
  // midtown Toronto in 2013," roasting in Concord, "a community and a
  // creative lab," collaborations, "no 'just okay' batches." Locations page
  // lists four Toronto cafés (Castlefield 2489 Yonge St, Broadway 2389 Yonge
  // St, The Well 8 Spadina Ave, Bloor St E 365 Bloor St E), a Concord
  // roastery and one in Seoul; this entry is Castlefield, first listed
  // (Mon–Fri 7am–7pm, Sat–Sun 8am–7pm). The site doesn't say which is the
  // 2013 original, and only gives "midtown" as an area, so that's the area
  // used. The pages read cover coffee retail and roasting, not a café menu,
  // so food is left low and every score is this session's read of that copy,
  // not a survey response.
  { id: 'demello', name: 'De Mello Coffee', slug: 'de-mello-coffee', city: 'toronto', area: 'Midtown', isPartner: false, vector: { drink: 62, energy: 52, aesthetic: 60, pace: 45, adventure: 65, price: 60, food: 30 } },
];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const c of CAFES) {
    const v = c.vector;
    await client.query(
      `insert into public.cafes
         (name, slug, neighbourhood, city, drink_score, energy_score, aesthetic_score, pace_score, adventure_score, price_score, food_score, partner_status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       on conflict (slug) do update set
         neighbourhood = excluded.neighbourhood,
         city = excluded.city,
         drink_score = excluded.drink_score,
         energy_score = excluded.energy_score,
         aesthetic_score = excluded.aesthetic_score,
         pace_score = excluded.pace_score,
         adventure_score = excluded.adventure_score,
         price_score = excluded.price_score,
         food_score = excluded.food_score,
         partner_status = excluded.partner_status,
         updated_at = now()`,
      [c.name, c.slug, c.area, c.city, v.drink, v.energy, v.aesthetic, v.pace, v.adventure, v.price, v.food, c.isPartner ? 'partner' : 'listed'],
    );
    console.log(`  → ${c.name}`);
  }
  console.log(`Seeded ${CAFES.length} cafés.`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
