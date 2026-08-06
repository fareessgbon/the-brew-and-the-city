import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AppNav } from '@/components/AppNav';
import { ProfilePreferencesForm } from '@/components/ProfilePreferencesForm';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import { ChangeEmailForm } from '@/components/account/ChangeEmailForm';
import { DeleteAccountForm } from '@/components/account/DeleteAccountForm';
import { createClient } from '@/lib/supabase/server';
import { PRIMARY_DRINK_CATEGORY_LABELS } from '@/lib/matching';
import { assertOnboarded } from '@/lib/server/requireOnboarded';
import { SignOutButton } from './SignOutButton';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/profile');
  await assertOnboarded(supabase, user.id);

  const { data: profileRow } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
  const { data: tasteProfile } = await supabase
    .from('taste_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '72px 0' }}>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <AppNav current="/profile" />
          <div className="label eyebrow">Your account</div>
          <h1 style={{ fontSize: 34, marginBottom: 24 }}>{profileRow?.name || user.email}</h1>

          <div className="ratio-box" style={{ marginBottom: 24 }}>
            <div className="ratio-row">
              <span>Email</span>
              <span>{user.email}</span>
            </div>
            <div className="ratio-row">
              <span>Member since</span>
              <span>{new Date(user.created_at).toLocaleDateString('en-CA')}</span>
            </div>
          </div>

          {tasteProfile ? (
            <>
              <div id="taste" className="ratio-box" style={{ marginBottom: 24, scrollMarginTop: 90 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="label">Your Taste</div>
                  <Link href="/onboarding/quiz" style={{ fontSize: 12.5 }}>
                    Retake the quiz →
                  </Link>
                </div>
                {tasteProfile.primary_drink_category ? (
                  <div className="ratio-row">
                    <span>Go-to drink</span>
                    <span>{PRIMARY_DRINK_CATEGORY_LABELS[tasteProfile.primary_drink_category]}</span>
                  </div>
                ) : null}
                {(['drink', 'energy', 'aesthetic', 'pace', 'adventure', 'price', 'food'] as const).map((dim) => (
                  <div className="ratio-row" key={dim}>
                    <span style={{ textTransform: 'capitalize' }}>{dim}</span>
                    <span>{tasteProfile[dim]}</span>
                  </div>
                ))}
              </div>

              <ProfilePreferencesForm
                radiusKm={tasteProfile.radius_km}
                worthTrip={tasteProfile.worth_the_trip}
                homeNeighbourhood={tasteProfile.home_neighbourhood}
                hasLocation={tasteProfile.home_latitude != null}
                primaryDrinkCategory={tasteProfile.primary_drink_category}
                needsNonDairy={tasteProfile.needs_non_dairy}
                needsGlutenFree={tasteProfile.needs_gluten_free}
                needsWheelchair={tasteProfile.needs_wheelchair}
              />
            </>
          ) : null}

          <div id="account-security" className="label" style={{ margin: '32px 0 12px', scrollMarginTop: 90 }}>
            Account security
          </div>
          <div className="ratio-box" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 8 }}>Change email</div>
            <ChangeEmailForm currentEmail={user.email ?? ''} />
          </div>
          <div className="ratio-box" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 8 }}>Change password</div>
            <ChangePasswordForm email={user.email ?? ''} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <SignOutButton />
            <DeleteAccountForm />
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
