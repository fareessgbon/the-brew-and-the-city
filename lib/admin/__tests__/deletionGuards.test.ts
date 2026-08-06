import { describe, expect, it } from 'vitest';
import { cafeDeletionBlockerMessage, describeCafeHistoryBlockers, rewardItemDeletionBlockerMessage, type CafeHistoryCounts } from '../deletionGuards';

const NO_HISTORY: CafeHistoryCounts = {
  visits: 0,
  redeemedRewards: 0,
  pendingRewards: 0,
  menuItems: 0,
  rewardItems: 0,
  savedCafes: 0,
};

describe('describeCafeHistoryBlockers / cafeDeletionBlockerMessage', () => {
  it('returns no blockers and a null message for a café with zero history', () => {
    expect(describeCafeHistoryBlockers(NO_HISTORY)).toEqual([]);
    expect(cafeDeletionBlockerMessage(NO_HISTORY)).toBeNull();
  });

  it('blocks on visits alone', () => {
    const counts = { ...NO_HISTORY, visits: 3 };
    expect(describeCafeHistoryBlockers(counts)).toEqual(['3 visit(s)/receipt(s)']);
    expect(cafeDeletionBlockerMessage(counts)).toMatch(/3 visit\(s\)\/receipt\(s\)/);
    expect(cafeDeletionBlockerMessage(counts)).toMatch(/Deactivate it instead/);
  });

  it('sums redeemed and pending rewards into a single redemption count', () => {
    const counts = { ...NO_HISTORY, redeemedRewards: 2, pendingRewards: 1 };
    expect(describeCafeHistoryBlockers(counts)).toEqual(['3 redemption(s)']);
  });

  it('blocks on menu items alone', () => {
    const counts = { ...NO_HISTORY, menuItems: 5 };
    expect(describeCafeHistoryBlockers(counts)).toEqual(['5 menu item(s)']);
  });

  it('blocks on reward items alone', () => {
    const counts = { ...NO_HISTORY, rewardItems: 2 };
    expect(describeCafeHistoryBlockers(counts)).toEqual(['2 reward item(s)']);
  });

  it('blocks on saved-café bookmarks alone', () => {
    const counts = { ...NO_HISTORY, savedCafes: 7 };
    expect(describeCafeHistoryBlockers(counts)).toEqual(['7 member bookmark(s)']);
  });

  it('lists every non-zero category together, in a stable order', () => {
    const counts: CafeHistoryCounts = { visits: 1, redeemedRewards: 1, pendingRewards: 0, menuItems: 2, rewardItems: 1, savedCafes: 4 };
    expect(describeCafeHistoryBlockers(counts)).toEqual(['1 visit(s)/receipt(s)', '1 redemption(s)', '2 menu item(s)', '1 reward item(s)', '4 member bookmark(s)']);
  });
});

describe('rewardItemDeletionBlockerMessage', () => {
  it('returns null when there are no redemptions', () => {
    expect(rewardItemDeletionBlockerMessage(0)).toBeNull();
  });

  it('returns a friendly message when there are redemptions, pointing at "unavailable" instead', () => {
    const message = rewardItemDeletionBlockerMessage(3);
    expect(message).not.toBeNull();
    expect(message).toContain('3 activation/redemption record(s)');
    expect(message).toMatch(/Mark it unavailable instead/);
  });
});
