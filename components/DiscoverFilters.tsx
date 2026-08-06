'use client';

import { useMemo, useState } from 'react';
import { CafeCard, type CafeCardData } from './CafeCard';

interface DiscoverCafe extends CafeCardData {
  oat: boolean;
  glutenFree: boolean;
  wheelchair: boolean;
  saved: boolean;
}

export function DiscoverFilters({ cafes, signedIn }: { cafes: DiscoverCafe[]; signedIn: boolean }) {
  const [neighbourhood, setNeighbourhood] = useState('');
  const [needsNonDairy, setNeedsNonDairy] = useState(false);
  const [needsGlutenFree, setNeedsGlutenFree] = useState(false);
  const [needsWheelchair, setNeedsWheelchair] = useState(false);

  const neighbourhoods = useMemo(() => {
    const set = new Set<string>();
    for (const cafe of cafes) {
      if (cafe.neighbourhood) set.add(cafe.neighbourhood);
    }
    return Array.from(set).sort();
  }, [cafes]);

  const filtered = cafes.filter((cafe) => {
    if (neighbourhood && cafe.neighbourhood !== neighbourhood) return false;
    if (needsNonDairy && !cafe.oat) return false;
    if (needsGlutenFree && !cafe.glutenFree) return false;
    if (needsWheelchair && !cafe.wheelchair) return false;
    return true;
  });

  const hasActiveFilters = !!neighbourhood || needsNonDairy || needsGlutenFree || needsWheelchair;

  function clearFilters() {
    setNeighbourhood('');
    setNeedsNonDairy(false);
    setNeedsGlutenFree(false);
    setNeedsWheelchair(false);
  }

  return (
    <div>
      <div className="ratio-box" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div>
          <label htmlFor="discover-neighbourhood" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--whisk)', marginBottom: 4 }}>
            Neighbourhood
          </label>
          <select id="discover-neighbourhood" value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--whisk-10)' }}>
            <option value="">All neighbourhoods</option>
            {neighbourhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
            <input type="checkbox" checked={needsNonDairy} onChange={(e) => setNeedsNonDairy(e.target.checked)} style={{ width: 'auto' }} />
            Non-dairy options
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
            <input type="checkbox" checked={needsGlutenFree} onChange={(e) => setNeedsGlutenFree(e.target.checked)} style={{ width: 'auto' }} />
            Gluten-free
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5 }}>
            <input type="checkbox" checked={needsWheelchair} onChange={(e) => setNeedsWheelchair(e.target.checked)} style={{ width: 'auto' }} />
            Step-free access
          </label>
        </div>

        {hasActiveFilters ? (
          <button type="button" className="btn btn-ghost" onClick={clearFilters} style={{ padding: '6px 14px', fontSize: 12.5 }}>
            Clear filters
          </button>
        ) : null}
      </div>

      {cafes.length > 0 ? (
        <div style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 12 }}>
          {filtered.length} of {cafes.length} café{cafes.length === 1 ? '' : 's'}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="notice-box">
          No cafés match those filters right now.{' '}
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ceremony)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div>
          {filtered.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} saved={cafe.saved} signedIn={signedIn} />
          ))}
        </div>
      )}
    </div>
  );
}
