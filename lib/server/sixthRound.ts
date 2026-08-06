import { randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type VisitRow = Database['public']['Tables']['visits']['Row'];
type RewardRow = Database['public']['Tables']['rewards']['Row'];
type RewardItemRow = Database['public']['Tables']['reward_items']['Row'];

const STAMPS_NEEDED = 5;
const MAX_STAMPS_PER_CAFE = 2;
const STAMP_EXPIRY_DAYS = 90;
const ACTIVATION_TTL_MS = 10 * 60 * 1000; // §8.11 — 10-minute activation window

export interface StampCard {
  stampCount: number;
  stampsNeeded: number;
  distinctCafes: number;
  eligibleVisits: VisitRow[];
  activeReward: RewardRow | null;
}

// Uses the admin client throughout — callers are expected to have already
// verified `userId` via a real Supabase session (supabase.auth.getUser())
// before calling in; every query here is still explicitly scoped with
// .eq('user_id', userId), so bypassing RLS doesn't widen what's actually
// read or written.
export async function getStampCard(userId: string): Promise<StampCard> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STAMP_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: visits }, { data: activeReward }] = await Promise.all([
    admin
      .from('visits')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .is('reward_id', null)
      .gte('visited_at', cutoff)
      .order('visited_at', { ascending: true }),
    admin.from('rewards').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
  ]);

  // Max 2 stamps count from the same café — earliest visits count first
  // (FIFO), so a member can't inflate their card by revisiting one spot.
  const perCafeCount = new Map<string, number>();
  const eligibleVisits: VisitRow[] = [];
  for (const visit of visits ?? []) {
    const count = perCafeCount.get(visit.cafe_id) ?? 0;
    if (count < MAX_STAMPS_PER_CAFE) {
      eligibleVisits.push(visit);
      perCafeCount.set(visit.cafe_id, count + 1);
    }
  }

  return {
    stampCount: Math.min(eligibleVisits.length, STAMPS_NEEDED),
    stampsNeeded: Math.max(0, STAMPS_NEEDED - eligibleVisits.length),
    distinctCafes: perCafeCount.size,
    eligibleVisits,
    activeReward: activeReward ?? null,
  };
}

function generateActivationCode(): string {
  // 4 chars, unambiguous alphabet (no 0/O/1/I) — read aloud at a counter,
  // short enough to type in a hurry. Short-lived (10 min) and single-use,
  // unlike the old permanent code, so 33^4 ≈ 1.2M combinations is plenty.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(4);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

// Creates a reward the moment a member becomes eligible, locking the 5
// consumed stamps (visits.reward_id) so they stop counting toward a next
// card immediately — not at redemption time. If a reward already exists
// (earned but not yet redeemed), returns that instead of creating a second.
// No code is assigned yet — a reward is "ready" but stays code-less until
// activateReward() below, matching §8.11: activation, not creation, is what
// starts the 10-minute clock.
export async function ensureRewardIfEligible(userId: string): Promise<RewardRow | null> {
  const card = await getStampCard(userId);
  if (card.activeReward) return card.activeReward;
  if (card.eligibleVisits.length < STAMPS_NEEDED) return null;

  const admin = createAdminClient();
  const toConsume = card.eligibleVisits.slice(0, STAMPS_NEEDED);

  const { data: reward, error } = await admin.from('rewards').insert({ user_id: userId }).select().single();
  if (error || !reward) throw new Error(error?.message ?? 'Could not create reward.');

  await admin
    .from('visits')
    .update({ reward_id: reward.id })
    .in('id', toConsume.map((v) => v.id));
  return reward;
}

export interface ParticipatingCafe {
  id: string;
  name: string;
  slug: string;
  items: { id: string; name: string; category: string }[];
}

// Cafés a member could activate their reward at right now — any partner
// with at least one available eligible item. Doesn't pre-filter by monthly
// cap (that would need a live count per café); activateReward() below is
// the actual gate and returns a clear error if a specific café is full.
export async function getParticipatingCafes(): Promise<ParticipatingCafe[]> {
  const admin = createAdminClient();
  const { data: items } = await admin
    .from('reward_items')
    .select('id, name, category, cafe_id, cafes(id, name, slug, partner_status)')
    .eq('is_available', true);

  const byCafe = new Map<string, ParticipatingCafe>();
  for (const item of items ?? []) {
    const cafe = item.cafes;
    if (!cafe || cafe.partner_status === 'listed') continue;
    if (!byCafe.has(cafe.id)) byCafe.set(cafe.id, { id: cafe.id, name: cafe.name, slug: cafe.slug, items: [] });
    byCafe.get(cafe.id)!.items.push({ id: item.id, name: item.name, category: item.category });
  }
  return Array.from(byCafe.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export class ActivationError extends Error {}

// §8.11 — activation is what generates the redeemable code and starts the
// 10-minute window; §3.0.5's monthly caps are enforced here, at the moment
// a member commits to a specific café and item, not earlier.
export async function activateReward(userId: string, cafeId: string, itemId: string): Promise<{ reward: RewardRow; item: RewardItemRow; cafeName: string }> {
  const admin = createAdminClient();

  const { data: reward } = await admin.from('rewards').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (!reward) throw new ActivationError('No reward ready to activate.');

  const { data: cafe } = await admin.from('cafes').select('id, name, partner_status, monthly_redemption_cap').eq('id', cafeId).maybeSingle();
  if (!cafe || cafe.partner_status === 'listed') throw new ActivationError('That café isn’t part of the City Card network.');

  const { data: item } = await admin.from('reward_items').select('*').eq('id', itemId).eq('cafe_id', cafeId).maybeSingle();
  if (!item || !item.is_available) throw new ActivationError('That item isn’t available right now — pick another.');

  const monthStart = startOfMonthIso();
  const { count: cafeRedemptions } = await admin
    .from('rewards')
    .select('id', { count: 'exact', head: true })
    .eq('redeemed_at_cafe_id', cafeId)
    .gte('redeemed_at', monthStart);
  if ((cafeRedemptions ?? 0) >= cafe.monthly_redemption_cap) {
    throw new ActivationError('This café has reached its redemption cap for the month — try another café or come back next month.');
  }

  if (item.monthly_cap !== null) {
    const { count: itemRedemptions } = await admin
      .from('rewards')
      .select('id', { count: 'exact', head: true })
      .eq('reward_item_id', itemId)
      .gte('redeemed_at', monthStart);
    if ((itemRedemptions ?? 0) >= item.monthly_cap) {
      throw new ActivationError('That item has reached its redemption cap for the month — pick another.');
    }
  }

  const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS).toISOString();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: activated, error } = await admin
      .from('rewards')
      .update({ code: generateActivationCode(), pending_cafe_id: cafeId, reward_item_id: itemId, activated_at: new Date().toISOString(), expires_at: expiresAt })
      .eq('id', reward.id)
      .eq('status', 'active')
      .select()
      .single();
    if (!error && activated) return { reward: activated, item, cafeName: cafe.name };
    if (error?.code !== '23505') throw new Error(error?.message ?? 'Could not activate reward.');
    // 23505 = code collision — retry with a fresh code.
  }
  throw new Error('Could not generate a unique activation code after several attempts.');
}
