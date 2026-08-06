import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStampCard, ensureRewardIfEligible, getParticipatingCafes } from '@/lib/server/sixthRound';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';

// GET /api/rewards — the signed-in user's current stamp card. If they've
// just crossed 5 eligible stamps and don't already have an active reward,
// one is created here (locking those 5 stamps) — this is the lazy trigger
// point, not a background job.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  try {
    const before = await getStampCard(user.id);
    const hadNoActiveReward = !before.activeReward;

    const reward = await ensureRewardIfEligible(user.id);
    if (reward && hadNoActiveReward) {
      await trackServerEvent('reward_earned', user.id, { rewardId: reward.id });
    }

    const card = reward ? await getStampCard(user.id) : before;
    const active = card.activeReward;

    // Activated and still within its 10-minute window — resumable on
    // refresh without re-picking a café. Otherwise "ready" (or expired,
    // which looks the same to the client: pick a café again).
    const isLiveActivation = !!active?.expires_at && new Date(active.expires_at) > new Date();

    let cafeName: string | null = null;
    let itemName: string | null = null;
    if (isLiveActivation && active?.pending_cafe_id && active.reward_item_id) {
      const admin = createAdminClient();
      const [{ data: cafe }, { data: item }] = await Promise.all([
        admin.from('cafes').select('name').eq('id', active.pending_cafe_id).maybeSingle(),
        admin.from('reward_items').select('name').eq('id', active.reward_item_id).maybeSingle(),
      ]);
      cafeName = cafe?.name ?? null;
      itemName = item?.name ?? null;
    }

    return NextResponse.json({
      stampCount: card.stampCount,
      stampsNeeded: card.stampsNeeded,
      distinctCafes: card.distinctCafes,
      reward: active
        ? {
            createdAt: active.created_at,
            code: isLiveActivation ? active.code : null,
            expiresAt: isLiveActivation ? active.expires_at : null,
            cafeName: isLiveActivation ? cafeName : null,
            itemName: isLiveActivation ? itemName : null,
          }
        : null,
      participatingCafes: active && !isLiveActivation ? await getParticipatingCafes() : [],
    });
  } catch (err) {
    await logServerError('api.rewards.get', err, undefined, user.id);
    return NextResponse.json({ error: 'Could not load your stamp card.' }, { status: 500 });
  }
}
