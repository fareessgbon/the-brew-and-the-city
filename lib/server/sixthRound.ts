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

// How many of a café's (or item's) monthly slots are already spoken for.
// Counts by `activated_at`, not `redeemed_at` — deliberately. `redeemed_at`
// only gets set at the counter, up to 10 minutes after activation, so a cap
// check that only counts completed redemptions leaves a window where
// several members can each activate against the same "last slot" before
// any of them has actually redeemed — no concurrency required, just two
// activations in the same 10-minute window. `pending_cafe_id` and
// `reward_item_id` are set at activation and never cleared by redemption
// (see app/api/portal/redeem/route.ts), so counting from them also covers
// completed redemptions for free.
//
// Trade-off, chosen deliberately: an activation that's abandoned (code
// expires, never redeemed) still counts against the month's cap under this
// query, where the old redeemed_at-only count would have quietly freed it
// back up. Undercounting availability is a retryable UX inconvenience;
// overcounting is real reimbursement liability — the direction this cap
// exists to guard.
async function countCafeSlotsUsed(admin: ReturnType<typeof createAdminClient>, cafeId: string, monthStart: string): Promise<number> {
  const { count } = await admin
    .from('rewards')
    .select('id', { count: 'exact', head: true })
    .eq('pending_cafe_id', cafeId)
    .gte('activated_at', monthStart);
  return count ?? 0;
}

async function countItemSlotsUsed(admin: ReturnType<typeof createAdminClient>, itemId: string, monthStart: string): Promise<number> {
  const { count } = await admin
    .from('rewards')
    .select('id', { count: 'exact', head: true })
    .eq('reward_item_id', itemId)
    .gte('activated_at', monthStart);
  return count ?? 0;
}

// This reward's 1-indexed rank among every activation at this café (or for
// this item) this month, ordered by activation time — `id` is a stable
// tiebreak for two activations landing in the same millisecond. Used only
// for the post-activation recheck below, and deliberately not a raw count:
// once two racing activations have both committed, a raw count is the same
// shared number for both requests' rechecks, so both would independently
// see "over cap" and both roll themselves back, wasting a slot neither
// needed to give up. Rank is different per reward, so exactly the
// activation(s) beyond the cap roll back — never zero, never more than
// necessary — because both requests compute the same ranking from the same
// committed rows and agree on which one(s) lose.
function rankById<T extends { id: string; activated_at: string | null }>(rows: T[], id: string): number {
  const sorted = [...rows].sort((a, b) => {
    if (a.activated_at !== b.activated_at) return (a.activated_at ?? '') < (b.activated_at ?? '') ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return sorted.findIndex((r) => r.id === id) + 1;
}

async function cafeActivationRank(admin: ReturnType<typeof createAdminClient>, cafeId: string, monthStart: string, rewardId: string): Promise<number> {
  const { data } = await admin.from('rewards').select('id, activated_at').eq('pending_cafe_id', cafeId).gte('activated_at', monthStart);
  return rankById((data ?? []) as { id: string; activated_at: string | null }[], rewardId);
}

async function itemActivationRank(admin: ReturnType<typeof createAdminClient>, itemId: string, monthStart: string, rewardId: string): Promise<number> {
  const { data } = await admin.from('rewards').select('id, activated_at').eq('reward_item_id', itemId).gte('activated_at', monthStart);
  return rankById((data ?? []) as { id: string; activated_at: string | null }[], rewardId);
}

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
  const cafeCapMessage = 'This café has reached its redemption cap for the month — try another café or come back next month.';
  const itemCapMessage = 'That item has reached its redemption cap for the month — pick another.';

  if ((await countCafeSlotsUsed(admin, cafeId, monthStart)) >= cafe.monthly_redemption_cap) {
    throw new ActivationError(cafeCapMessage);
  }
  if (item.monthly_cap !== null && (await countItemSlotsUsed(admin, itemId, monthStart)) >= item.monthly_cap) {
    throw new ActivationError(itemCapMessage);
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
    if (!error && activated) {
      // Re-check now that this activation is actually committed — closes
      // the window where two concurrent activations could both pass the
      // count above and jointly exceed the cap. Rank-based (see
      // cafeActivationRank), not a raw recount, so exactly the
      // activation(s) beyond the cap roll back rather than every racing
      // request rolling back together.
      const cafeRank = await cafeActivationRank(admin, cafeId, monthStart, reward.id);
      const itemRank = item.monthly_cap !== null ? await itemActivationRank(admin, itemId, monthStart, reward.id) : null;
      const overCafeCap = cafeRank > cafe.monthly_redemption_cap;
      const overItemCap = itemRank !== null && item.monthly_cap !== null && itemRank > item.monthly_cap;
      if (overCafeCap || overItemCap) {
        await admin
          .from('rewards')
          .update({ code: null, pending_cafe_id: null, reward_item_id: null, activated_at: null, expires_at: null })
          .eq('id', reward.id);
        throw new ActivationError(overCafeCap ? cafeCapMessage : itemCapMessage);
      }
      return { reward: activated, item, cafeName: cafe.name };
    }
    if (error?.code !== '23505') throw new Error(error?.message ?? 'Could not activate reward.');
    // 23505 = code collision — retry with a fresh code.
  }
  throw new Error('Could not generate a unique activation code after several attempts.');
}
