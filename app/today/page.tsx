import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';
import { assertOnboarded } from '@/lib/server/requireOnboarded';
import { TodayMatches } from '@/components/TodayMatches';
import { AppNav } from '@/components/AppNav';

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/today');
  await assertOnboarded(supabase, user.id);

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <AppNav current="/today" />
          <div className="label eyebrow">Today</div>
          <h1 style={{ fontSize: 30, marginBottom: 24 }}>Your matches</h1>
          <TodayMatches />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
