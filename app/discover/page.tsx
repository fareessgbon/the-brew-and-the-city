import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { DiscoverFilters } from '@/components/DiscoverFilters';
import { AppNav } from '@/components/AppNav';
import { getCafesForVisitor } from '@/lib/server/cafeMatching';

export default async function DiscoverPage() {
  const { cafes, savedIds, signedIn, hasProfile } = await getCafesForVisitor();

  // An account stuck mid-onboarding gets sent back to finish it; a visitor
  // who hasn't signed up at all is still free to browse unranked (§2 of the
  // "why not just use Maps" pitch depends on this staying open).
  if (signedIn && !hasProfile) redirect('/onboarding');

  const cafesWithSaved = cafes.map((cafe) => ({ ...cafe, saved: savedIds.has(cafe.id) }));

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <AppNav current="/discover" />
          <div className="label eyebrow">Discover</div>
          <h1 style={{ fontSize: 30, marginBottom: 12 }}>Every café, ranked for you</h1>
          {!hasProfile ? (
            <div className="notice-box" style={{ marginBottom: 24 }}>
              <Link href="/login">Log in</Link> and take the quiz to see these ranked by match %.
            </div>
          ) : null}
          <DiscoverFilters cafes={cafesWithSaved} signedIn={signedIn} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
