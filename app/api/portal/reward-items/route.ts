import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPortalSession } from '@/lib/portalSession';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';
import type { RewardItemCategory } from '@/lib/supabase/types';

const CATEGORIES: RewardItemCategory[] = ['drink', 'pastry', 'food', 'other'];
const MAX_ITEMS_PER_CAFE = 5;

function parseCategory(value: unknown): RewardItemCategory {
  return CATEGORIES.includes(value as RewardItemCategory) ? (value as RewardItemCategory) : 'drink';
}

// POST /api/portal/reward-items — body: { cafeId, name, description?, category?, priceCents?, monthlyCap? }.
// §3.0.5 — a café curates up to 5 eligible items for City Card redemption
// instead of a flat "any drink" reward. Capped at 5 here, not just in the UI,
// since this is the only write path (no public insert policy on the table).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cafeId = typeof body?.cafeId === 'string' ? body.cafeId : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!cafeId || !name) {
    return NextResponse.json({ error: 'cafeId and name are required.' }, { status: 400 });
  }

  const authorized = await hasPortalSession(cafeId);
  if (!authorized) return NextResponse.json({ error: 'Not signed in to this café’s portal.' }, { status: 401 });

  const admin = createAdminClient();
  const { count } = await admin.from('reward_items').select('id', { count: 'exact', head: true }).eq('cafe_id', cafeId);
  if ((count ?? 0) >= MAX_ITEMS_PER_CAFE) {
    return NextResponse.json({ error: `You can list at most ${MAX_ITEMS_PER_CAFE} eligible items at a time — remove one first.` }, { status: 400 });
  }

  const description = typeof body?.description === 'string' ? body.description.trim() || null : null;
  const category = parseCategory(body?.category);
  const priceCents = typeof body?.priceCents === 'number' && Number.isFinite(body.priceCents) ? Math.round(body.priceCents) : null;
  const monthlyCap = typeof body?.monthlyCap === 'number' && Number.isFinite(body.monthlyCap) ? Math.max(0, Math.round(body.monthlyCap)) : null;

  const { data: item, error } = await admin
    .from('reward_items')
    .insert({ cafe_id: cafeId, name, description, category, price_cents: priceCents, monthly_cap: monthlyCap })
    .select()
    .single();

  if (error) {
    await logServerError('api.portal.reward-items.create', error, { cafeId });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('reward_item_created', null, { cafeId, rewardItemId: item.id, source: 'cafe_portal' });

  return NextResponse.json({ item });
}
