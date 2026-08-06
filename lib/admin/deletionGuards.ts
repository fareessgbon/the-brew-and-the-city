// Pure "should this delete be blocked?" decision logic, split out of
// app/admin/actions.ts so it's unit-testable without a Supabase/Next.js
// runtime. The actions themselves still do the actual DB counting and
// throwing — this module only decides what a given set of counts means.
// See lib/admin/__tests__/deletionGuards.test.ts.

export interface CafeHistoryCounts {
  visits: number;
  redeemedRewards: number;
  pendingRewards: number;
  menuItems: number;
  rewardItems: number;
  savedCafes: number;
}

// Not exposed in the admin UI (see CafeForm's "Active" checkbox for the
// normal, reversible way to hide a café) — kept as a guarded server action
// rather than removed outright, for the rare case of a café created by
// mistake with zero real activity. cafes.id cascades into visits/menu_items/
// reward_items/saved_cafes on delete, and rewards.redeemed_at_cafe_id /
// pending_cafe_id have no ON DELETE at all (a stray redemption would throw a
// raw FK error instead of a friendly one) — so anything with real history
// must be deactivated, never deleted.
export function describeCafeHistoryBlockers(counts: CafeHistoryCounts): string[] {
  const redemptionCount = counts.redeemedRewards + counts.pendingRewards;
  const blockers: string[] = [];
  if (counts.visits > 0) blockers.push(`${counts.visits} visit(s)/receipt(s)`);
  if (redemptionCount > 0) blockers.push(`${redemptionCount} redemption(s)`);
  if (counts.menuItems > 0) blockers.push(`${counts.menuItems} menu item(s)`);
  if (counts.rewardItems > 0) blockers.push(`${counts.rewardItems} reward item(s)`);
  if (counts.savedCafes > 0) blockers.push(`${counts.savedCafes} member bookmark(s)`);
  return blockers;
}

// Returns null when the café is safe to delete, or the friendly error
// message to throw otherwise.
export function cafeDeletionBlockerMessage(counts: CafeHistoryCounts): string | null {
  const blockers = describeCafeHistoryBlockers(counts);
  if (blockers.length === 0) return null;
  return `Can't delete this café — it has ${blockers.join(', ')} on record. Deactivate it instead (uncheck "Active" on the café form) to hide it without losing history.`;
}

// Not exposed anywhere but the admin delete action — rewards.reward_item_id
// has no ON DELETE clause, so deleting an item ever activated/redeemed would
// otherwise throw a raw FK error instead of a friendly one. Returns null
// when the item is safe to delete.
export function rewardItemDeletionBlockerMessage(redemptionCount: number): string | null {
  if (redemptionCount <= 0) return null;
  return `Can't delete this item — it has ${redemptionCount} activation/redemption record(s). Mark it unavailable instead.`;
}
