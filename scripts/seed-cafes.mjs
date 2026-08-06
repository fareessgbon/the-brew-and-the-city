// Seeds the `cafes` (+ `cafe_attributes`) tables from the placeholder data in
// lib/data/cafes.ts. Once this has run, app code should read from Supabase
// instead — this script is a one-time bridge, not something to keep running.
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
