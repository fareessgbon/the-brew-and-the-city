import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { activateReward, ActivationError } from '@/lib/server/sixthRound';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { isFeatureEnabled } from '@/lib/server/featureFlags';

// POST /api/rewards/activate — body: { cafeId, itemId }. Turns a "ready"
// reward into a live, 10-minute redeemable code at a specific café (§8.11).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  // §11 reward_activation — server-checked, not just hidden in the UI.
  if (!(await isFeatureEnabled('reward_activation'))) {
    return NextResponse.json({ error: 'Reward activation is temporarily paused.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const cafeId = typeof body?.cafeId === 'string' ? body.cafeId : '';
  const itemId = typeof body?.itemId === 'string' ? body.itemId : '';
  if (!cafeId || !itemId) {
    return NextResponse.json({ error: 'cafeId and itemId are required.' }, { status: 400 });
  }

  try {
    const { reward, item, cafeName } = await activateReward(user.id, cafeId, itemId);
    await trackServerEvent('reward_activated', user.id, { cafeId, itemId });
    return NextResponse.json({
      code: reward.code,
      expiresAt: reward.expires_at,
      itemName: item.name,
      cafeName,
    });
  } catch (err) {
    if (err instanceof ActivationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    await logServerError('api.rewards.activate', err, { cafeId, itemId }, user.id);
    return NextResponse.json({ error: 'Could not activate your reward.' }, { status: 500 });
  }
}
