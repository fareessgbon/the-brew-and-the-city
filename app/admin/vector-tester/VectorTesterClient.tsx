'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculateMatch, isWithinRadius, DIMS, CONTEXTS, type ContextKey, type Dim, type TasteVector } from '@/lib/matching';
import { distanceMetresOrNull } from '@/lib/location/distance';
import type { CafeApiShape } from '@/app/api/cafes/route';

const MONTHS = [
  [1, 'January'], [2, 'February'], [3, 'March'], [4, 'April'],
  [5, 'May'], [6, 'June'], [7, 'July'], [8, 'August'],
  [9, 'September'], [10, 'October'], [11, 'November'], [12, 'December'],
] as const;

// Downtown Calgary — a reasonable default test location, not a real user's.
const DEFAULT_LAT = 51.0447;
const DEFAULT_LNG = -114.0719;

export function VectorTesterClient() {
  const [cafes, setCafes] = useState<CafeApiShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [vector, setVector] = useState<TasteVector>({ drink: 50, energy: 50, aesthetic: 50, pace: 50, adventure: 50, price: 50, food: 50 });
  const [context, setContext] = useState<ContextKey | ''>('');
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [radiusKm, setRadiusKm] = useState(5);
  const [onlyInRadius, setOnlyInRadius] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cafes')
      .then((r) => r.json())
      .then((data) => setCafes(data.cafes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    return cafes
      .map((cafe) => {
        const distanceMetres = distanceMetresOrNull(lat, lng, cafe.latitude, cafe.longitude);
        const withinRadius = distanceMetres === null || isWithinRadius(distanceMetres, radiusKm);
        return {
          cafe,
          distanceMetres,
          withinRadius,
          result: calculateMatch({
            userProfile: vector,
            cafeProfile: cafe.vector,
            context: context || null,
            distanceMetres,
            month,
            radiusKm,
          }),
        };
      })
      .filter((r) => !onlyInRadius || r.withinRadius)
      .sort((a, b) => b.result.totalScore - a.result.totalScore);
  }, [cafes, vector, context, lat, lng, radiusKm, onlyInRadius, month]);

  function setDim(dim: Dim, value: number) {
    setVector((prev) => ({ ...prev, [dim]: Math.max(0, Math.min(100, value)) }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not available in this browser.');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => setGeoError(err.message),
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {DIMS.map((dim) => (
          <div key={dim}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)', marginBottom: 4 }}>
              {dim}: {vector[dim]}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={vector[dim]}
              onChange={(e) => setDim(dim, Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>

      <div className="label" style={{ marginBottom: 8 }}>
        Test location &amp; radius
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>Latitude</label>
          <input type="number" step="any" value={lat} onChange={(e) => setLat(Number(e.target.value))} style={{ width: 120 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>Longitude</label>
          <input type="number" step="any" value={lng} onChange={(e) => setLng(Number(e.target.value))} style={{ width: 120 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>Radius (km)</label>
          <input type="number" min={0} step={0.5} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} style={{ width: 90 }} />
        </div>
        <button type="button" className="btn btn-ghost" onClick={useMyLocation} style={{ padding: '8px 14px', fontSize: 13 }}>
          Use my location
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, textTransform: 'none' }}>
          <input type="checkbox" checked={onlyInRadius} onChange={(e) => setOnlyInRadius(e.target.checked)} style={{ width: 'auto' }} />
          Only show cafés within radius
        </label>
      </div>
      {geoError ? (
        <p style={{ color: 'var(--error, #A8503F)', fontSize: 12.5, marginBottom: 8 }}>{geoError}</p>
      ) : null}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>Context</label>
          <select value={context} onChange={(e) => setContext(e.target.value as ContextKey | '')}>
            <option value="">None</option>
            {CONTEXTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, marginBottom: 4 }}>Month (winter proximity decay)</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map(([n, label]) => (
              <option key={n} value={n}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading cafés…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Café', 'Status', 'Total', 'Taste', 'Context', 'Proximity', 'Distance', 'In radius', 'Reasons'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(({ cafe, result, distanceMetres, withinRadius }) => (
                <tr key={cafe.id}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontWeight: 600 }}>{cafe.name}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', color: 'var(--whisk)' }}>{cafe.partnerStatus}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                    <span className="pct">{result.totalScore}%</span>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{result.tasteScore}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{result.contextScore ?? '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{result.proximityScore ?? '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                    {distanceMetres === null ? 'Unknown' : `${(distanceMetres / 1000).toFixed(1)} km`}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                    {distanceMetres === null ? '—' : withinRadius ? <span style={{ color: 'var(--ceremony)' }}>✓</span> : <span style={{ color: 'var(--whisk)' }}>✗</span>}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontSize: 12.5, color: 'var(--ink)' }}>
                    {result.reasons.join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 ? <p style={{ color: 'var(--whisk)', marginTop: 12 }}>No cafés match this location/radius.</p> : null}
        </div>
      )}
    </div>
  );
}
