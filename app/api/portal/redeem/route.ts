import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPortalSession } from '@/lib/portalSession';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { isFeatureEnabled } from '@/lib/server/featureFlags';
import { checkRateLimit } from '@/lib/server/rateLimit';

// Activation codes are 4 characters from a 33-character alphabet (~1.19M
// combinations) and live for 10 minutes. Without a throttle, a café with a
// valid portal session could guess at another member's pending code inside
// that window and redeem real reward value at its own counter. Scoped per
// café rather than per IP: the session, not the network path, is the thing
// being abused. 20 failures per 10 minutes leaves honest mistyping alone
// (staff read these codes aloud) while making a search of the space
// hopeless.
const MAX_FAILED_REDEMPTIONS = 20;
const REDEEM_WINDOW_MS = 10 * 60 * 1000;

// POST /api/portal/redeem — body: { cafeId: string, code: string }.
// Redeems an active reward at whichever partner café the member walks into
// — the whole point of the City Card is that it isn't tied to one café.
// The portal-session cookie only has to prove "this is a real, logged-in
// café portal," not that it's the café that originally issued any visit.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cafeId = typeof body?.cafeId === 'string' ? body.cafeId : '';
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!cafeId || !code) {
    return NextResponse.json({ error: 'cafeId and code are required.' }, { status: 400 });
  }

  const authorized = await hasPortalSession(cafeId);
  if (!authorized) return NextResponse.json({ error: 'Not signed in to this café’s portal.' }, { status: 401 });

  // §11 reward_redemption — server-checked, not just hidden in the UI.
  if (!(await isFeatureEnabled('reward_redemption'))) {
    return NextResponse.json({ error: 'Reward redemption is temporarily paused.' }, { status: 503 });
  }

  const admin = createAdminClient();
  // Scoped to this café — a code activated for café A can't be redeemed at
  // café B, matching §8.11's "redeeming café matches cafe_id" check.
  const { data: reward } = await admin.from('rewards').select('*').eq('code', code).eq('pending_cafe_id', cafeId).maybeSingle();

  if (!reward) {
    // Only wrong guesses consume budget — a café redeeming a hundred valid
    // codes in a busy hour is never throttled.
    const attempts = checkRateLimit(`redeem:${cafeId}`, MAX_FAILED_REDEMPTIONS, REDEEM_WINDOW_MS);
    if (!attempts.allowed) {
      await logServerError('api.portal.redeem.throttled', new Error('Too many failed redemption attempts'), { cafeId });
      return NextResponse.json(
        { error: 'Too many incorrect codes — please wait a few minutes and try again.' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: 'No reward found for that code at this café.' }, { status: 404 });
  }
  if (reward.status === 'redeemed') {
    return NextResponse.json({ error: `Already redeemed${reward.redeemed_at ? ' on ' + new Date(reward.redeemed_at).toLocaleDateString('en-CA') : ''}.` }, { status: 409 });
  }
  if (!reward.expires_at || new Date(reward.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This code has expired — ask the member to activate a new one.' }, { status: 410 });
  }

  const { error } = await admin
    .from('rewards')
    .update({ status: 'redeemed', redeemed_at_cafe_id: cafeId, redeemed_at: new Date().toISOString() })
    .eq('id', reward.id)
    .eq('status', 'active'); // guards a race between two simultaneous redemption attempts

  if (error) {
    await logServerError('api.portal.redeem', error, { cafeId, code });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('reward_redeemed', reward.user_id, { rewardId: reward.id, cafeId });

  return NextResponse.json({ success: true });
}
