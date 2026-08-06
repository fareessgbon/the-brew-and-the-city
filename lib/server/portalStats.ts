import { createAdminClient } from '@/lib/supabase/server';

// §13.5 — the portal home screen is a live counter, not a menu. One huge
// number (stamps this week) with a week-over-week arrow; everything else is
// supporting text an owner can read in under two seconds behind a counter.

const AVG_DRINK_PRICE_CENTS = 650; // §3.1a.2 — "Calgary matcha latte, avg menu price ~$6.50"
const DOWN_WEEK_THRESHOLD = 0.85; // flag city-wide context if this café's stamps dropped >15%

export interface WeeklyCafeStats {
  stampsThisWeek: number;
  stampsLastWeek: number;
  matchedVisitsEstimateCents: number;
  firstTimeCustomersThisWeek: number;
  rewardsRedeemedThisWeek: number;
  reimbursementOwedCents: number;
  /** Only set when this café's stamps dropped and city-wide traffic also
   * dropped — §13.5's "never show a bad week without context." */
  citywideTrendPct: number | null;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function countApprovedStamps(admin: ReturnType<typeof createAdminClient>, cafeId: string | null, sinceIso: string, beforeIso?: string): Promise<number> {
  let query = admin.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('reviewed_at', sinceIso);
  if (cafeId) query = query.eq('cafe_id', cafeId);
  if (beforeIso) query = query.lt('reviewed_at', beforeIso);
  const { count } = await query;
  return count ?? 0;
}

export async function getWeeklyCafeStats(cafeId: string): Promise<WeeklyCafeStats> {
  const admin = createAdminClient();
  const weekStart = daysAgoIso(7);
  const twoWeeksStart = daysAgoIso(14);

  const [stampsThisWeek, stampsLastWeek, citywideThisWeek, citywideLastWeek] = await Promise.all([
    countApprovedStamps(admin, cafeId, weekStart),
    countApprovedStamps(admin, cafeId, twoWeeksStart, weekStart),
    countApprovedStamps(admin, null, weekStart),
    countApprovedStamps(admin, null, twoWeeksStart, weekStart),
  ]);

  // First-time customers this week: distinct members with an approved visit
  // at this café this week who had no earlier approved visit here.
  const { data: thisWeekVisits } = await admin.from('visits').select('user_id').eq('cafe_id', cafeId).eq('status', 'approved').gte('reviewed_at', weekStart);
  const thisWeekUserIds = Array.from(new Set((thisWeekVisits ?? []).map((v) => v.user_id)));

  let firstTimeCustomersThisWeek = thisWeekUserIds.length;
  if (thisWeekUserIds.length > 0) {
    const { data: priorVisits } = await admin
      .from('visits')
      .select('user_id')
      .eq('cafe_id', cafeId)
      .eq('status', 'approved')
      .lt('reviewed_at', weekStart)
      .in('user_id', thisWeekUserIds);
    const returningUserIds = new Set((priorVisits ?? []).map((v) => v.user_id));
    firstTimeCustomersThisWeek = thisWeekUserIds.filter((id) => !returningUserIds.has(id)).length;
  }

  // Rewards redeemed this week at this café, and what's owed for them.
  const { data: redemptions } = await admin
    .from('rewards')
    .select('reward_item_id, reward_items(reimbursement_cents)')
    .eq('redeemed_at_cafe_id', cafeId)
    .eq('status', 'redeemed')
    .gte('redeemed_at', weekStart);

  const rewardsRedeemedThisWeek = redemptions?.length ?? 0;
  const reimbursementOwedCents = (redemptions ?? []).reduce((sum, r) => sum + (r.reward_items?.reimbursement_cents ?? AVG_DRINK_PRICE_CENTS), 0);

  // Only surface city-wide context when this café is down AND the city is
  // also down — a café down while the city is flat is a café-specific
  // problem, not weather, and shouldn't get an excuse.
  let citywideTrendPct: number | null = null;
  const cafeDown = stampsLastWeek > 0 && stampsThisWeek < stampsLastWeek * DOWN_WEEK_THRESHOLD;
  const cityDown = citywideLastWeek > 0 && citywideThisWeek < citywideLastWeek;
  if (cafeDown && cityDown) {
    citywideTrendPct = Math.round(((citywideThisWeek - citywideLastWeek) / citywideLastWeek) * 100);
  }

  return {
    stampsThisWeek,
    stampsLastWeek,
    matchedVisitsEstimateCents: stampsThisWeek * AVG_DRINK_PRICE_CENTS,
    firstTimeCustomersThisWeek,
    rewardsRedeemedThisWeek,
    reimbursementOwedCents,
    citywideTrendPct,
  };
}
