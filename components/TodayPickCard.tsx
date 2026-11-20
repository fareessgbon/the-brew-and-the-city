'use client';

import { useEffect, useMemo, useState } from 'react';
import { describeVector } from '@/lib/data/cafeFields';
import { dismissForToday, loadDismissedToday } from '@/lib/localDismissals';
import type { DiscoverCafe } from '@/components/DiscoverContent';
import type { ScoredCafe } from '@/lib/scoreCafes';

// §8.1's Today's Pick. `queue` is the server-ranked list (already excludes
// anything on the City List) — this component just walks it, skipping
// whatever's been dismissed today (client-only, see lib/localDismissals.ts)
// so "Not it" never needs a round trip to get its next candidate.
export function TodayPickCard({
  queue,
  savedCafeIds,
  onToggleSave,
}: {
  queue: (DiscoverCafe & ScoredCafe)[];
  savedCafeIds: ReadonlySet<string>;
  onToggleSave: (cafeId: string) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage read, same pattern as DiscoverContent's own taste-state effect.
    setDismissed(loadDismissedToday());
  }, []);

  const pick = useMemo(() => {
    if (!dismissed) return null;
    return queue.find((c) => !dismissed.has(c.id)) ?? null;
  }, [queue, dismissed]);

  if (dismissed === null) return null; // avoid a flash of the wrong pick before localStorage loads

  if (!pick) {
    return (
      <div className="discover-card" style={{ maxWidth: 480 }}>
        <h3>Nothing new today.</h3>
        <p className="discover-card-desc">
          You&apos;ve either saved or passed on everything the network has to offer right now — check back tomorrow, or
          browse Discover for the full list.
        </p>
      </div>
    );
  }

  const saved = savedCafeIds.has(pick.id);

  return (
    <div className="discover-card" style={{ maxWidth: 480 }}>
      <div className="discover-card-top">
        <div>
          <h3>{pick.name}</h3>
          <div className="discover-card-area">{pick.area}</div>
        </div>
        <span className="discover-card-pct">{pick.pct}%</span>
      </div>
      <p className="discover-card-desc">
        {pick.reasons.length > 0 ? pick.reasons.join(' · ') : describeVector(pick.vector).join(' · ')}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="discover-visit-btn" onClick={() => onToggleSave(pick.id)}>
          {saved ? 'Saved to City List' : 'Save to City List'}
        </button>
        <button
          type="button"
          className="discover-visit-btn"
          onClick={() => setDismissed(dismissForToday(pick.id))}
        >
          Not it
        </button>
      </div>
    </div>
  );
}
