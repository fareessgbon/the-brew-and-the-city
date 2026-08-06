import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/onboarding');

  const { data: profile } = await supabase.from('taste_profiles').select('onboarding_completed').eq('user_id', user.id).maybeSingle();
  if (profile?.onboarding_completed) redirect('/today');

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '72px 0' }}>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <div className="label eyebrow">You&apos;re in</div>
          <h1 style={{ fontSize: 34, marginBottom: 12 }}>Welcome, {user.email}.</h1>
          <p style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 32 }}>
            Nine quick questions build your taste profile for real — saved to your account, not just this browser.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/onboarding/quiz" className="btn btn-primary">
              Take the quiz →
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
