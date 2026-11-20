import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// §8.10 / migration 0008 — five verified visits, at most two of them at
// the same café (so five stamps can't come from one loyal regular alone;
// the card is meant to pull members across the network), earn one City
// Card. Called after every admin approval — the row that tips a member
// over 5 qualifying visits is the one that mints the reward, not a
// separate scheduled job (there's no scheduler in this environment).
const STAMPS_REQUIRED = 5;
const MAX_STAMPS_PER_CAFE = 2;

function generateRewardCode(): string {
  // BW-XXXX-XX, uppercase alphanumeric — matches the shape the mockup's
  // City Card shows at the counter, without borrowing its literal value.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — read aloud at a register
  const bytes = randomBytes(6);
  const part = (n: number) => Array.from({ length: n }, (_, i) => alphabet[bytes[i] % alphabet.length]).join('');
  return `BW-${part(4)}-${part(2)}`;
}

// Shared by evaluateCityCard (which acts on the result) and the dashboard's
// read-only progress display (STAMPS_REQUIRED, so the progress bar shown to
// a member always matches what will actually trigger a reward) — walks
// oldest-first, taking at most MAX_STAMPS_PER_CAFE per café.
export function qualifyingStamps(approvedVisits: readonly { id: string; cafe_id: string }[]): string[] {
  const perCafeCount = new Map<string, number>();
  const qualifying: string[] = [];
  for (const visit of approvedVisits) {
    const count = perCafeCount.get(visit.cafe_id) ?? 0;
    if (count >= MAX_STAMPS_PER_CAFE) continue;
    perCafeCount.set(visit.cafe_id, count + 1);
    qualifying.push(visit.id);
    if (qualifying.length === STAMPS_REQUIRED) break;
  }
  return qualifying;
}

export { STAMPS_REQUIRED };

// Must be called with the admin (service-role) client — it writes
// visits.reward_id and inserts into rewards, neither of which a signed-in
// member's own session is allowed to do directly.
export async function evaluateCityCard(admin: SupabaseClient<Database>, userId: string): Promise<{ awarded: boolean }> {
  const { data: approved, error } = await admin
    .from('visits')
    .select('id, cafe_id, visited_at')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .is('reward_id', null)
    .order('visited_at', { ascending: true });

  if (error || !approved) return { awarded: false };

  // Oldest-first, so the earliest visits that satisfy the cap are the ones
  // that count — a member always sees their oldest eligible stamps convert
  // first.
  const qualifying = qualifyingStamps(approved);
  if (qualifying.length < STAMPS_REQUIRED) return { awarded: false };

  const { data: reward, error: rewardError } = await admin
    .from('rewards')
    .insert({ user_id: userId, code: generateRewardCode() })
    .select('id')
    .single();

  if (rewardError || !reward) return { awarded: false };

  await admin.from('visits').update({ reward_id: reward.id, stamp_awarded: true }).in('id', qualifying);

  return { awarded: true };
}
