import { DemoBanner } from '@/components/DemoBanner';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomeContent } from '@/components/HomeContent';
import { createClient } from '@/lib/supabase/server';
import type { HeroCafe } from '@/components/HeroQuiz';

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cafes')
    .select('id, name, slug, neighbourhood, drink_score, energy_score, aesthetic_score, pace_score, adventure_score, price_score, food_score')
    .order('name');

  const cafes: HeroCafe[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    area: c.neighbourhood ?? 'Calgary',
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
      <DemoBanner />
      <SiteHeader />
      <HomeContent cafes={cafes} />
      <SiteFooter />
    </>
  );
}
