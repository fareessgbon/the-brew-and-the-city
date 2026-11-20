'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DiscoverContent, type DiscoverCafe } from '@/components/DiscoverContent';
import { ProximityMap } from '@/components/ProximityMap';
import { TodayPickCard } from '@/components/TodayPickCard';
import { CityListPanel } from '@/components/CityListPanel';
import { CityCardPanel, type VisitHistoryRow } from '@/components/CityCardPanel';
import { TasteEditor } from '@/components/TasteEditor';
import { ProfilePanel } from '@/components/ProfilePanel';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { NEUTRAL_VECTOR, type Dim, type TasteVector } from '@/lib/matching';
import type { ScoredCafe } from '@/lib/scoreCafes';

type Tab = 'today' | 'discover' | 'map' | 'list' | 'card' | 'taste' | 'profile';

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'discover', label: 'Discover' },
  { id: 'map', label: 'Map' },
  { id: 'list', label: 'City List' },
  { id: 'card', label: 'City Card' },
  { id: 'taste', label: 'Your Taste' },
  { id: 'profile', label: 'Profile' },
];

// The signed-in account area — what /discover renders once there's a real
// user (see app/discover/page.tsx). Six tabs, one taste vector, one City
// List shared between Today's Pick and Discover so saving a café from
// either place shows up in the other immediately.
export function AccountDashboard({
  cafes,
  accountEmail,
  memberSince,
  taste,
  answeredDims,
  savedCafeIds: initialSavedCafeIds,
  todaysQueue,
  cityCard,
}: {
  cafes: DiscoverCafe[];
  accountEmail: string;
  memberSince: string | null;
  taste: TasteVector | null;
  answeredDims: Dim[];
  savedCafeIds: string[];
  todaysQueue: (DiscoverCafe & ScoredCafe)[];
  cityCard: {
    stamps: number;
    stampsRequired: number;
    activeReward: { code: string } | null;
    history: VisitHistoryRow[];
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('today');
  const [savedCafeIds, setSavedCafeIds] = useState<Set<string>>(() => new Set(initialSavedCafeIds));

  async function toggleSave(cafeId: string) {
    const wasSaved = savedCafeIds.has(cafeId);
    // Optimistic — the button should feel instant across every tab that
    // shows this café; a failed request rolls the local set back instead
    // of leaving the UI out of sync with what the server actually holds.
    setSavedCafeIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(cafeId);
      else next.add(cafeId);
      return next;
    });
    try {
      const res = await fetch('/api/account/city-list', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSavedCafeIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(cafeId);
        else next.delete(cafeId);
        return next;
      });
    }
  }

  async function handleSignOut() {
    await createBrowserSupabaseClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <section style={{ padding: '0 0 72px' }}>
      {/* .hero already supplies the dark --ceremony band plus readable
          .eyebrow/.btn-ghost overrides for it (see globals.css, shared with
          the homepage hero) — account-header only adds the tighter padding
          and the tab row underneath. */}
      <div className="hero account-header">
        <div
          className="wrap"
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', paddingBottom: 22 }}
        >
          <div>
            <div className="label eyebrow">Signed in</div>
            <h1 style={{ fontSize: 30, color: 'var(--paper)', margin: '6px 0 0' }}>{accountEmail}</h1>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
        <div className="wrap">
          <div className="tabs-row account-tabs-row" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'discover' ? (
        <DiscoverContent cafes={cafes} savedCafeIds={savedCafeIds} onToggleSave={toggleSave} />
      ) : (
        <div className="wrap" style={{ paddingTop: 40 }}>
          {tab === 'today' ? <TodayPickCard queue={todaysQueue} savedCafeIds={savedCafeIds} onToggleSave={toggleSave} /> : null}
          {tab === 'map' ? (
            <ProximityMap
              cafes={cafes.map((c) => ({ id: c.id, name: c.name, vector: c.vector, highlight: savedCafeIds.has(c.id) }))}
              you={taste ?? NEUTRAL_VECTOR}
              showLabelsFor={new Set(cafes.map((c) => c.id))}
            />
          ) : null}
          {tab === 'list' ? <CityListPanel cafes={cafes} savedCafeIds={Array.from(savedCafeIds)} onRemove={toggleSave} /> : null}
          {tab === 'card' ? <CityCardPanel cafes={cafes} {...cityCard} /> : null}
          {tab === 'profile' ? (
            <ProfilePanel
              email={accountEmail}
              memberSince={memberSince}
              taste={taste}
              stamps={cityCard.stamps}
              stampsRequired={cityCard.stampsRequired}
              savedCount={savedCafeIds.size}
              visitCount={cityCard.history.length}
              onEditTaste={() => setTab('taste')}
              onSignOut={handleSignOut}
            />
          ) : null}
          {tab === 'taste' ? <TasteEditor initial={taste ?? NEUTRAL_VECTOR} answeredDims={answeredDims} /> : null}
        </div>
      )}
    </section>
  );
}
