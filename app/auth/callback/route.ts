import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeInternalPath } from '@/lib/safeRedirect';
import { trackServerEvent } from '@/lib/server/trackEvent';

// A brand-new account's very first sign-in lands here within moments of the
// row being created — Supabase doesn't hand back an explicit "this was a
// signup, not a login" flag, so this timing gap is the practical way to
// tell them apart without adding our own signup-intent tracking.
const NEW_ACCOUNT_WINDOW_MS = 15_000;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeInternalPath(searchParams.get('next'), '/onboarding');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = data.user;
      if (user && Date.now() - Date.parse(user.created_at) < NEW_ACCOUNT_WINDOW_MS) {
        // user_id alone is enough to look up the account if ever needed —
        // no reason to duplicate the email address into the analytics
        // properties blob as well (§12 — don't collect unnecessary PII).
        await trackServerEvent('account_created', user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
