// Pure reward-item field validation for the admin café editor — split out
// of app/admin/actions.ts so it's unit-testable without a Supabase/Next.js
// runtime. Behavior is unchanged from before the split; see
// lib/admin/__tests__/rewardItems.test.ts.

import type { RewardItemCategory } from '@/lib/supabase/types';

export const REWARD_ITEM_CATEGORIES: RewardItemCategory[] = ['drink', 'pastry', 'food', 'other'];

// Mirrors MAX_ITEMS_PER_CAFE in app/api/portal/reward-items/route.ts — the
// café portal and the admin console are two write paths onto the same cap,
// so both need to enforce the identical number or a café could end up over
// it if both add around the same time.
export const MAX_REWARD_ITEMS_PER_CAFE = 5;

export interface RewardItemFields {
  name: string;
  description: string | null;
  category: RewardItemCategory;
  price_cents: number | null;
  reimbursement_cents: number;
  monthly_cap: number | null;
  is_available: boolean;
}

export type RewardItemFieldsResult = { fields: RewardItemFields } | { error: string };

// §2 "Rewards" — unlike menu items, reward items have money attached
// (reimbursement_cents is what the café is owed per redemption), so admin
// gets full create/edit/delete, not just add/remove. Shared by addRewardItem
// and updateRewardItem so a field that's invalid on create is invalid on
// edit too.
export function rewardItemFieldsFromForm(formData: FormData): RewardItemFieldsResult {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Item name is required.' };

  const category = formData.get('category');
  if (!REWARD_ITEM_CATEGORIES.includes(category as RewardItemCategory)) {
    return { error: `Category must be one of ${REWARD_ITEM_CATEGORIES.join(', ')}.` };
  }

  const description = String(formData.get('description') ?? '').trim() || null;

  let price_cents: number | null = null;
  const priceRaw = String(formData.get('price_dollars') ?? '').trim();
  if (priceRaw) {
    const dollars = Number(priceRaw);
    if (!Number.isFinite(dollars) || dollars < 0) return { error: 'Regular price can’t be negative — enter a number ≥ $0, or leave it blank.' };
    price_cents = Math.round(dollars * 100);
  }

  const reimbursementRaw = String(formData.get('reimbursement_dollars') ?? '').trim();
  const reimbursementDollars = Number(reimbursementRaw);
  if (!reimbursementRaw || !Number.isFinite(reimbursementDollars) || reimbursementDollars < 0) {
    return { error: 'Reimbursement can’t be negative — enter a number ≥ $0.' };
  }
  const reimbursement_cents = Math.round(reimbursementDollars * 100);

  let monthly_cap: number | null = null;
  const capRaw = String(formData.get('monthly_cap') ?? '').trim();
  if (capRaw) {
    const cap = Number(capRaw);
    if (!Number.isFinite(cap) || !Number.isInteger(cap) || cap < 1) {
      return { error: 'Monthly cap must be a whole number of 1 or more — leave it blank for no cap.' };
    }
    monthly_cap = cap;
  }

  const is_available = formData.get('is_available') === 'true';

  return {
    fields: {
      name,
      description,
      category: category as RewardItemCategory,
      price_cents,
      reimbursement_cents,
      monthly_cap,
      is_available,
    },
  };
}
