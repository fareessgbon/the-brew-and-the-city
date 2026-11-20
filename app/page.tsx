import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomeContent } from '@/components/HomeContent';
import { DEMO_CAFES } from '@/lib/data/demoCafes';

// Title/description inherit from the root layout — this page only adds
// the canonical, since '/' is the one URL every other page's internal
// links (and search results) should collapse back to.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// The quiz runs on invented sample cafés (lib/data/demoCafes.ts), not the
// seeded Supabase rows — real business names next to placeholder scores
// implied a partnership that doesn't exist yet.
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        <HomeContent cafes={DEMO_CAFES} />
      </main>
      <SiteFooter />
    </>
  );
}
