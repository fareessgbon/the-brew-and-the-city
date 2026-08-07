import { DemoBanner } from '@/components/DemoBanner';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomeContent } from '@/components/HomeContent';
import { createAdminClient } from '@/lib/supabase/server';
import type { HeroCafe } from '@/components/HeroQuiz';

// Reads real seeded café data from the shared Supabase project — the same
// data the full product will use — so the neighbourhood chips below are a
// genuine preview of real coverage, not invented. createAdminClient()
// rather than a session-bound client: this build has no user sessions at
// all (cafes has a public read policy anyway; using the admin client here
// is just consistent with everywhere else in this codebase, not a
// privilege escalation).
export default async function HomePage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('cafes')
    .select('id, name, slug, neighbourhood, verified_at, drink_score, energy_score, aesthetic_score, pace_score, adventure_score, price_score, food_score')
    .order('name');

  // Drives the demo/placeholder disclaimer below — false (still show it)
  // until every café currently listed here has actually been visited and
  // verified in person, not just until any one of them has.
  const allVerified = (data ?? []).length > 0 && (data ?? []).every((c) => c.verified_at !== null);

  const cafes: HeroCafe[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    // Never fall back to the city name — a café with no neighbourhood set
    // needs a real one filled in on its record, not a stand-in that reads
    // as if "Calgary" were itself a neighbourhood.
    area: c.neighbourhood ?? 'Neighbourhood TBD',
    vector: {
      drink: c.drink_score,
      energy: c.energy_score,
      aesthetic: c.aesthetic_score,
      pace: c.pace_score,
      adventure: c.adventure_score,
      price: c.price_score,
      food: c.food_score,
    },
  }));

  return (
    <>
      <DemoBanner show={!allVerified} />
      <SiteHeader />
      <HomeContent cafes={cafes} />
      <SiteFooter />
    </>
  );
}
