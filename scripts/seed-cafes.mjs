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
  { id: 'monogram', name: 'Monogram', slug: 'monogram', area: 'Mission', isPartner: true, vector: { drink: 78, energy: 22, aesthetic: 30, pace: 75, adventure: 40, price: 70, food: 35 } },
  { id: 'rosso', name: 'Rosso Coffee Roasters', slug: 'rosso', area: 'Mission', isPartner: false, vector: { drink: 35, energy: 55, aesthetic: 40, pace: 45, adventure: 30, price: 45, food: 60 } },
  { id: 'soughtxfound', name: 'Sought x Found', slug: 'sought-x-found', area: 'Inglewood', isPartner: true, vector: { drink: 60, energy: 68, aesthetic: 70, pace: 45, adventure: 60, price: 55, food: 50 } },
  { id: 'philseb', name: 'Phil & Sebastian', slug: 'phil-and-sebastian', area: 'Kensington', isPartner: false, vector: { drink: 55, energy: 58, aesthetic: 50, pace: 40, adventure: 40, price: 60, food: 45 } },
  { id: 'analog', name: 'Analog Coffee', slug: 'analog', area: 'Beltline', isPartner: true, vector: { drink: 70, energy: 35, aesthetic: 35, pace: 65, adventure: 45, price: 60, food: 25 } },
  { id: 'fratello', name: 'Fratello', slug: 'fratello', area: 'Downtown', isPartner: true, vector: { drink: 45, energy: 50, aesthetic: 45, pace: 45, adventure: 35, price: 40, food: 40 } },
  { id: 'heritage', name: 'Calgary Heritage Roasting', slug: 'calgary-heritage-roasting', area: 'Inglewood', isPartner: true, vector: { drink: 50, energy: 45, aesthetic: 55, pace: 50, adventure: 50, price: 50, food: 45 } },
  { id: 'paradigm', name: 'Paradigm Spark', slug: 'paradigm-spark', area: 'Beltline', isPartner: true, vector: { drink: 65, energy: 60, aesthetic: 65, pace: 40, adventure: 70, price: 65, food: 55 } },
  { id: 'eightounce', name: 'Eight Ounce Coffee Club', slug: 'eight-ounce-coffee-club', area: 'Bridgeland', isPartner: true, vector: { drink: 50, energy: 40, aesthetic: 60, pace: 55, adventure: 55, price: 50, food: 30 } },
  { id: 'deville', name: 'Deville Coffee', slug: 'deville', area: 'Downtown', isPartner: false, vector: { drink: 40, energy: 65, aesthetic: 35, pace: 35, adventure: 25, price: 45, food: 50 } },
  // Sourced from theandsome.com (2026-08-23) — flower shop + café + bakery
  // hybrid, 540 7 Ave NW, Kensington. Vector is this session's read of the
  // menu/site copy (Korean-café style: injeolmi/black sesame/rose/lavender
  // lattes, a "Cloud Series," croffles, high tea), not a survey response —
  // flag for a real taste-vector survey once they're approached as a partner.
  { id: 'andsome', name: 'And Some', slug: 'and-some', area: 'Kensington', isPartner: false, vector: { drink: 22, energy: 60, aesthetic: 85, pace: 60, adventure: 78, price: 62, food: 72 } },
  // Sourced from mypiknic.square.site + mypiknic.ca (2026-08-23) — Korean-
  // inspired sandwich café. Address confirmed directly on mypiknic.ca's own
  // Contact page: 255 Brentwood Pl NW, Calgary, AB T2L 2M5 (the postal code
  // a Yelp listing gave, T2L 1K8, doesn't match this and was dropped —
  // trust the business's own page). Brentwood (near U of C).
  // "Fresh, budget-friendly options for takeout, delivery, and catering" is
  // the business's own framing — counter-service, not a linger-and-work
  // spot, hence the low pace/aesthetic here relative to the other entries.
  // Brentwood isn't in HomeContent.tsx's CORE_NEIGHBOURHOODS list (the
  // walkable-core chip strip), so this café won't surface there until that
  // list is deliberately widened — expected, not a bug. Vector is this
  // session's read, not a survey response — same flag as And Some above.
  { id: 'mypiknic', name: 'My Piknic', slug: 'my-piknic', area: 'Brentwood', isPartner: false, vector: { drink: 40, energy: 45, aesthetic: 25, pace: 20, adventure: 55, price: 25, food: 80 } },
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
  { id: 'uncommondrip', name: 'Uncommon Drip', slug: 'uncommon-drip', area: 'Bridgeland', isPartner: false, vector: { drink: 55, energy: 80, aesthetic: 60, pace: 45, adventure: 70, price: 55, food: 75 } },
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
  { id: 'semantics', name: 'Semantics Cafe', slug: 'semantics-cafe', area: 'Beltline', isPartner: false, vector: { drink: 50, energy: 70, aesthetic: 65, pace: 70, adventure: 75, price: 50, food: 30 } },
  // Sourced from alforno.ca (2026-08-23) — bakery/café/restaurant, this
  // entry is the primary/original location (222 7 St SW, Eau Claire); the
  // business actually runs 7 Calgary locations plus a Canmore opening,
  // which a real profile would need to pick one of or model separately.
  // Full bakery + brunch/lunch/dinner + $45/person afternoon tea + wine/
  // beer/cocktails — moderate-to-upscale ($4–$30+), food-forward rather
  // than a coffee-and-laptop spot. Eau Claire isn't in HomeContent.tsx's
  // CORE_NEIGHBOURHOODS list, same as My Piknic's Brentwood — expected,
  // not a bug. Vector is this session's read, not a survey response.
  { id: 'alforno', name: 'Alforno Bakery and Café', slug: 'alforno', area: 'Eau Claire', isPartner: false, vector: { drink: 30, energy: 60, aesthetic: 65, pace: 70, adventure: 35, price: 70, food: 85 } },
];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const c of CAFES) {
    const v = c.vector;
    await client.query(
      `insert into public.cafes
         (name, slug, neighbourhood, drink_score, energy_score, aesthetic_score, pace_score, adventure_score, price_score, food_score, partner_status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (slug) do update set
         neighbourhood = excluded.neighbourhood,
         drink_score = excluded.drink_score,
         energy_score = excluded.energy_score,
         aesthetic_score = excluded.aesthetic_score,
         pace_score = excluded.pace_score,
         adventure_score = excluded.adventure_score,
         price_score = excluded.price_score,
         food_score = excluded.food_score,
         partner_status = excluded.partner_status,
         updated_at = now()`,
      [c.name, c.slug, c.area, v.drink, v.energy, v.aesthetic, v.pace, v.adventure, v.price, v.food, c.isPartner ? 'partner' : 'listed'],
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
