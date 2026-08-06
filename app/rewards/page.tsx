import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AppNav } from '@/components/AppNav';
import { RewardsCard } from '@/components/RewardsCard';
import { createClient } from '@/lib/supabase/server';
import { assertOnboarded } from '@/lib/server/requireOnboarded';

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/rewards');
  await assertOnboarded(supabase, user.id);

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <AppNav current="/rewards" />
          <div className="label eyebrow">The City Card</div>
          <h1 style={{ fontSize: 30, marginBottom: 24 }}>Five visits. Your free item is on us.</h1>
          <RewardsCard />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
