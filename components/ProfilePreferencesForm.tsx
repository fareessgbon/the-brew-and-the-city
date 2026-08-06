'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CALGARY_NEIGHBOURHOODS } from '@/lib/data/neighbourhoods';
import { PRIMARY_DRINK_CATEGORIES, PRIMARY_DRINK_CATEGORY_LABELS, type PrimaryDrinkCategory } from '@/lib/matching';
import { memberFetch } from '@/lib/client/memberFetch';

interface ProfilePreferencesFormProps {
  radiusKm: number;
  worthTrip: boolean;
  homeNeighbourhood: string | null;
  hasLocation: boolean;
  primaryDrinkCategory: PrimaryDrinkCategory | null;
  needsNonDairy: boolean;
  needsGlutenFree: boolean;
  needsWheelchair: boolean;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function ProfilePreferencesForm({
  radiusKm,
  worthTrip,
  homeNeighbourhood,
  hasLocation,
  primaryDrinkCategory,
  needsNonDairy,
  needsGlutenFree,
  needsWheelchair,
}: ProfilePreferencesFormProps) {
  const router = useRouter();
  const [radius, setRadius] = useState(radiusKm);
  const [trip, setTrip] = useState(worthTrip);
  const [neighbourhood, setNeighbourhood] = useState(homeNeighbourhood ?? '');
  const [category, setCategory] = useState<PrimaryDrinkCategory | null>(primaryDrinkCategory);
  const [nonDairy, setNonDairy] = useState(needsNonDairy);
  const [glutenFree, setGlutenFree] = useState(needsGlutenFree);
  const [wheelchair, setWheelchair] = useState(needsWheelchair);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function save(body: Record<string, unknown>) {
    setStatus('saving');
    setError('');
    try {
      const res = await memberFetch('/api/profile/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setStatus('saved');
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function saveRadiusAndTrip(e: React.FormEvent) {
    e.preventDefault();
    save({ radiusKm: radius, worthTrip: trip });
  }

  function saveDrinkAndRequirements(e: React.FormEvent) {
    e.preventDefault();
    save({ primaryDrinkCategory: category, needsNonDairy: nonDairy, needsGlutenFree: glutenFree, needsWheelchair: wheelchair });
  }

  function shareLocation() {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Your browser doesn’t support location sharing.');
      return;
    }
    setStatus('saving');
    navigator.geolocation.getCurrentPosition(
      (position) => save({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => {
        setStatus('error');
        setError('Could not get your location.');
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  function submitNeighbourhood() {
    if (!neighbourhood) return;
    save({ neighbourhood });
  }

  const busy = status === 'saving';

  return (
    <div className="ratio-box" style={{ marginBottom: 24 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        Preferences
      </div>

      <form onSubmit={saveRadiusAndTrip} style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13.5, marginBottom: 6 }}>Travel radius: {radius} km</label>
        <input type="range" min={1} max={30} value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12 }}>
          <input type="checkbox" checked={trip} onChange={(e) => setTrip(e.target.checked)} style={{ width: 'auto' }} />
          Show up to 3 exceptional matches outside my radius (&ldquo;Worth the trip&rdquo;)
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy} style={{ padding: '8px 18px', fontSize: 13 }}>
          {busy ? 'Saving…' : 'Save radius & trip preference'}
        </button>
      </form>

      <form onSubmit={saveDrinkAndRequirements} style={{ marginBottom: 16, borderTop: '1px solid var(--whisk-10)', paddingTop: 16 }}>
        <label htmlFor="drink-category" style={{ display: 'block', fontSize: 13.5, marginBottom: 6 }}>
          Go-to drink
        </label>
        <select
          id="drink-category"
          value={category ?? ''}
          onChange={(e) => setCategory((e.target.value || null) as PrimaryDrinkCategory | null)}
          style={{ marginBottom: 12 }}
        >
          <option value="">Not set</option>
          {PRIMARY_DRINK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PRIMARY_DRINK_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        <div style={{ fontSize: 13.5, marginBottom: 6 }}>Filter out</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
          <input type="checkbox" checked={nonDairy} onChange={(e) => setNonDairy(e.target.checked)} style={{ width: 'auto' }} />
          I need non-dairy options
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 8 }}>
          <input type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} style={{ width: 'auto' }} />
          Gluten-free
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12 }}>
          <input type="checkbox" checked={wheelchair} onChange={(e) => setWheelchair(e.target.checked)} style={{ width: 'auto' }} />
          Step-free access
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy} style={{ padding: '8px 18px', fontSize: 13 }}>
          {busy ? 'Saving…' : 'Save drink & filters'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--whisk-10)', paddingTop: 16 }}>
        <label style={{ display: 'block', fontSize: 13.5, marginBottom: 8 }}>
          Home location {hasLocation ? (homeNeighbourhood ? `— ${homeNeighbourhood}` : '— set') : '— not set'}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost" onClick={shareLocation} disabled={busy} style={{ padding: '8px 16px', fontSize: 13 }}>
            Share current location
          </button>
          <select value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} disabled={busy}>
            <option value="">Pick a neighbourhood</option>
            {CALGARY_NEIGHBOURHOODS.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={submitNeighbourhood} disabled={busy || !neighbourhood} style={{ padding: '8px 16px', fontSize: 13 }}>
            Set
          </button>
          {hasLocation ? (
            <button
              type="button"
              onClick={() => save({ clearLocation: true })}
              disabled={busy}
              style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--whisk)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Clear location
            </button>
          ) : null}
        </div>
      </div>

      {status === 'saved' ? <div style={{ fontSize: 12.5, color: 'var(--ceremony)', marginTop: 10 }}>Saved.</div> : null}
      {error ? <div style={{ fontSize: 12.5, color: 'var(--error, #A8503F)', marginTop: 10 }}>{error}</div> : null}
    </div>
  );
}
