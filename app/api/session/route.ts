import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

// GET /api/session — the single source of truth the nav components poll on
// mount and on auth state changes. Computes isAdmin/onboardingCompleted
// server-side (ADMIN_EMAILS isn't a NEXT_PUBLIC_ var, and onboarding status
// lives in taste_profiles) so client nav code never has to guess at either.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ signedIn: false, email: null, isAdmin: false, onboardingCompleted: false });
  }

  const { data: profile } = await supabase
    .from('taste_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    signedIn: true,
    email: user.email ?? null,
    isAdmin: isAdminEmail(user.email),
    onboardingCompleted: !!profile?.onboarding_completed,
  });
}
