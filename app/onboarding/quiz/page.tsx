import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';
import { FullQuiz } from '@/components/FullQuiz';

export default async function OnboardingQuizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/onboarding/quiz');

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap">
          <div className="label eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>
            Your Taste
          </div>
          <h1 style={{ fontSize: 28, textAlign: 'center', marginBottom: 32 }}>Nine questions. Then it&apos;s saved for good.</h1>
          <FullQuiz />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
