'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CALGARY_NEIGHBOURHOODS } from '@/lib/data/neighbourhoods';

type Status = 'idle' | 'locating' | 'saving' | 'error';

export function LocationSetup() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');

  async function save(body: Record<string, unknown>) {
    setStatus('saving');
    setError('');
    try {
      const res = await fetch('/api/profile/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your location.');
      router.push('/today');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function shareLocation() {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Your browser doesn’t support location sharing — pick a neighbourhood instead.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => save({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => {
        setStatus('error');
        setError('Could not get your location — pick a neighbourhood instead, or continue without one.');
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  function submitNeighbourhood() {
    if (!neighbourhood) return;
    save({ neighbourhood });
  }

  const busy = status === 'locating' || status === 'saving';

  return (
    <div>
      <button type="button" className="btn btn-primary" onClick={shareLocation} disabled={busy} style={{ marginBottom: 20 }}>
        {status === 'locating' ? 'Locating…' : 'Share my current location'}
      </button>

      <div className="ratio-box" style={{ marginBottom: 20 }}>
        <div className="label" style={{ marginBottom: 10 }}>
          Or pick a neighbourhood
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} disabled={busy}>
            <option value="">Select one</option>
            {CALGARY_NEIGHBOURHOODS.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={submitNeighbourhood} disabled={busy || !neighbourhood}>
            Continue
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => save({})}
        disabled={busy}
        style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--whisk)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Continue without location
      </button>

      {error ? <div className="match-disclaimer" style={{ color: 'var(--error, #A8503F)', marginTop: 16 }}>{error}</div> : null}
    </div>
  );
}
