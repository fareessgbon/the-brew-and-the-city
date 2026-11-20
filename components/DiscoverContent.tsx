'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PRIMARY_DRINK_CATEGORIES,
  PRIMARY_DRINK_CATEGORY_LABELS,
  type ContextKey,
  type Dim,
  type PrimaryDrinkCategory,
  type TasteVector,
} from '@/lib/matching';
import { describeVector, isUnscored } from '@/lib/data/cafeFields';
import { scoreCafes } from '@/lib/scoreCafes';
import { loadTasteState } from '@/lib/localTaste';
import { addVisit, loadVisits, type VisitCounts } from '@/lib/localVisits';
import { ProximityMap } from '@/components/ProximityMap';

export interface DiscoverCafe {
  id: string;
  name: string;
  slug: string;
  area: string;
  drinkCategories: PrimaryDrinkCategory[];
  vector: TasteVector;
}

interface TasteState {
  vector: TasteVector;
  answeredDims: Dim[];
  context: ContextKey | null;
}

const FILTERS: Array<{ key: PrimaryDrinkCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  ...PRIMARY_DRINK_CATEGORIES.map((c) => ({ key: c, label: PRIMARY_DRINK_CATEGORY_LABELS[c] })),
];

// The homepage quiz and this page share one taste profile (see
// lib/localTaste.ts) so "discover" means something once you've answered a
// few questions, not a second, disconnected quiz. Reaching this page at all
// now needs a real Supabase Auth sign-in (proxy.ts, app/discover/page.tsx)
// — a deliberate, narrow exception to §0.4 (see chat). What that sign-in
// gates is still local, though: match % and the "I've been here" visit log
// both live only in this browser, nothing saved server-side, gone if you
// clear site data — the account proves you're a real person, it doesn't
// carry your activity anywhere.
export function DiscoverContent({
  cafes,
  savedCafeIds,
  onToggleSave,
}: {
  cafes: DiscoverCafe[];
  // Both optional: a signed-out render of this same component (there isn't
  // one today, but nothing here requires an account) simply gets no City
  // List button, rather than a broken one with nowhere to save to.
  savedCafeIds?: ReadonlySet<string>;
  onToggleSave?: (cafeId: string) => void;
}) {
  const [taste, setTaste] = useState<TasteState | null>(null);
  const [visits, setVisits] = useState<VisitCounts>({});
  const [filter, setFilter] = useState<PrimaryDrinkCategory | 'all'>('all');
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    const persisted = loadTasteState();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage read, same pattern as HomeContent's own taste-state effect.
      setTaste({ vector: persisted.vector, answeredDims: persisted.answeredDims, context: persisted.context });
    }
    setVisits(loadVisits());
  }, []);

  const activeFilters = useMemo(
    () => FILTERS.filter((f) => f.key === 'all' || cafes.some((c) => c.drinkCategories.includes(f.key as PrimaryDrinkCategory))),
    [cafes],
  );

  const filtered = useMemo(
    () => (filter === 'all' ? cafes : cafes.filter((c) => c.drinkCategories.includes(filter))),
    [cafes, filter],
  );

  // Only scored (and only sorted by match) once real answers exist — a
  // neutral-vector score would still vary café to café, which could read as
  // a personalized ranking when it isn't one. Unranked, it's alphabetical,
  // same order the query itself returns.
  const scored = useMemo(() => {
    if (!taste) return filtered.map((c) => ({ ...c, pct: null as number | null, reasons: [] as string[] }));
    return scoreCafes(filtered, taste.vector, taste.answeredDims, taste.context);
  }, [filtered, taste]);

  const topIds = useMemo(
    () => (taste ? new Set(scored.slice(0, 3).map((c) => c.id)) : new Set<string>()),
    [scored, taste],
  );
  const allIds = useMemo(() => new Set(scored.map((c) => c.id)), [scored]);

  function handleVisit(slug: string) {
    setVisits(addVisit(slug));
  }

  const visitedCafes = cafes.filter((c) => (visits[c.slug] ?? 0) > 0);

  return (
    <section style={{ padding: '56px 0 72px' }}>
      <div className="wrap">
        <div className="label eyebrow">Discover</div>
        <h1 style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--ceremony)' }}>
          Every café in the network, ranked your way.
        </h1>
        {taste ? (
          <p className="section-lede" style={{ margin: '12px 0 32px' }}>
            Matched against the answers you gave on the homepage quiz.{' '}
            <Link href="/#quiz">Retake it</Link> any time and this list updates with it.
          </p>
        ) : (
          <p className="section-lede" style={{ margin: '12px 0 32px' }}>
            Take the <Link href="/#quiz">quiz</Link> on the homepage first, and every match below will
            be scored against your actual taste instead of sitting unranked.
          </p>
        )}

        <div className="discover-controls">
          <div className="discover-filters" role="group" aria-label="Filter by drink">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`discover-filter${filter === f.key ? ' active' : ''}`}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="tabs-row discover-view-toggle" role="group" aria-label="View">
            <button type="button" className={`tab-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className={`tab-btn${view === 'map' ? ' active' : ''}`} onClick={() => setView('map')}>
              Map
            </button>
          </div>
        </div>

        {view === 'map' ? (
          <ProximityMap
            cafes={scored.map((c) => ({ id: c.id, name: c.name, vector: c.vector, highlight: topIds.has(c.id) }))}
            you={taste?.vector ?? null}
            showLabelsFor={allIds}
          />
        ) : (
          <div className="discover-grid">
            {scored.map((c) => {
              const unscored = isUnscored(c.vector);
              const visitCount = visits[c.slug] ?? 0;
              return (
                <div className="discover-card" key={c.id}>
                  <div className="discover-card-top">
                    <div>
                      <h3>{c.name}</h3>
                      <div className="discover-card-area">{c.area}</div>
                    </div>
                    {unscored ? (
                      <span className="discover-card-pct discover-card-pct--muted">Not yet scored</span>
                    ) : c.pct !== null ? (
                      <span className="discover-card-pct">{c.pct}%</span>
                    ) : null}
                  </div>
                  <p className="discover-card-desc">
                    {unscored ? 'Nobody has scored this café yet.' : describeVector(c.vector).join(' · ')}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="discover-visit-btn" onClick={() => handleVisit(c.slug)}>
                      {visitCount > 0 ? `Been here · ${visitCount}×` : "I've been here"}
                    </button>
                    {onToggleSave ? (
                      <button
                        type="button"
                        className="discover-visit-btn"
                        onClick={() => onToggleSave(c.id)}
                        aria-pressed={savedCafeIds?.has(c.id) ?? false}
                      >
                        {savedCafeIds?.has(c.id) ? 'Saved to City List' : 'Save to City List'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {visitedCafes.length > 0 ? (
          <div className="discover-visits">
            <div className="label" style={{ color: 'var(--whisk)' }}>
              Your visits · saved on this device only, not your City Card
            </div>
            <ul className="discover-visits-list">
              {visitedCafes.map((c) => (
                <li key={c.id}>
                  {c.name} — {visits[c.slug]}×
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
