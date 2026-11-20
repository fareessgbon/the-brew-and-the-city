'use client';

import { describeVector, isUnscored } from '@/lib/data/cafeFields';
import type { DiscoverCafe } from '@/components/DiscoverContent';

// §8.4 — "places you want to try," sortable by Match % in the real spec;
// this list is short enough in practice (a handful of saves, not hundreds)
// that a plain most-recently-saved order covers it without adding a sort
// control nobody would reach for yet.
export function CityListPanel({
  cafes,
  savedCafeIds,
  onRemove,
}: {
  cafes: DiscoverCafe[];
  savedCafeIds: string[];
  onRemove: (cafeId: string) => void;
}) {
  const saved = savedCafeIds.map((id) => cafes.find((c) => c.id === id)).filter((c): c is DiscoverCafe => c != null);

  if (saved.length === 0) {
    return (
      <div className="discover-card" style={{ maxWidth: 480 }}>
        <h3>Nothing saved yet.</h3>
        <p className="discover-card-desc">
          Save a café from Today&apos;s Pick or Discover and it lands here, with the reason it matched.
        </p>
      </div>
    );
  }

  return (
    <div className="discover-grid">
      {saved.map((c) => (
        <div className="discover-card" key={c.id}>
          <div className="discover-card-top">
            <div>
              <h3>{c.name}</h3>
              <div className="discover-card-area">{c.area}</div>
            </div>
          </div>
          <p className="discover-card-desc">{isUnscored(c.vector) ? 'Nobody has scored this café yet.' : describeVector(c.vector).join(' · ')}</p>
          <button type="button" className="discover-visit-btn" onClick={() => onRemove(c.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
