import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';
import { LocationSetup } from '@/components/LocationSetup';

export default async function OnboardingLocationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/onboarding/location');

  const { data: profile } = await supabase.from('taste_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (!profile) redirect('/onboarding/quiz');

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 480 }}>
          <div className="label eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>
            Almost there
          </div>
          <h1 style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>Where should we measure from?</h1>
          <p style={{ fontSize: 15, color: 'var(--ink)', textAlign: 'center', marginBottom: 32 }}>
            This is what &ldquo;within your radius&rdquo; actually measures against. You can change it later from
            your profile.
          </p>
          <LocationSetup />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
