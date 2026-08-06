'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

interface ParticipatingCafe {
  id: string;
  name: string;
  slug: string;
  items: { id: string; name: string; category: string }[];
}

interface RewardsData {
  stampCount: number;
  stampsNeeded: number;
  distinctCafes: number;
  reward: { createdAt: string; code: string | null; expiresAt: string | null; cafeName: string | null; itemName: string | null } | null;
  participatingCafes: ParticipatingCafe[];
}

export function RewardsCard() {
  const [data, setData] = useState<RewardsData | null>(null);
  const [error, setError] = useState('');

  function load() {
    fetch('/api/rewards')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Could not load your City Card.');
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'));
  }

  useEffect(load, []);

  if (error) return <div className="notice-box">{error}</div>;
  if (!data) return <p style={{ color: 'var(--whisk)' }}>Loading your card…</p>;

  const stamps = Array.from({ length: 5 }, (_, i) => i < data.stampCount);
  const isLive = !!data.reward?.code;

  return (
    <div>
      <div className="round-card" style={{ marginBottom: 24 }}>
        <div className="label">Your City Card</div>
        <div className="stamp-row">
          {stamps.map((done, i) => (
            <div key={i} className={done ? 'stamp done' : 'stamp'}>
              {done ? i + 1 : ''}
            </div>
          ))}
          <div className={`stamp reward${data.reward ? ' done' : ''}`}>Free</div>
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink)', marginTop: 14 }}>
          {data.reward
            ? 'Five visits, verified — your free item is ready to redeem.'
            : `${data.stampsNeeded} more visit${data.stampsNeeded === 1 ? '' : 's'} to go, across at least ${Math.max(1, 3 - data.distinctCafes)} more café${Math.max(1, 3 - data.distinctCafes) === 1 ? '' : 's'} if you're relying on repeats.`}
        </div>
      </div>

      {isLive && data.reward?.code && data.reward.expiresAt ? (
        <ActiveRedemption
          code={data.reward.code}
          expiresAt={data.reward.expiresAt}
          cafeName={data.reward.cafeName}
          itemName={data.reward.itemName}
          onExpired={load}
        />
      ) : data.reward ? (
        <ActivatePicker cafes={data.participatingCafes} onActivated={load} />
      ) : (
        <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
          Upload a receipt from any partner café&apos;s page after you visit to earn a visit on your City Card. Max 2
          visits count from the same café, and visits expire after 90 days of inactivity.
        </p>
      )}
    </div>
  );
}

function ActiveRedemption({
  code,
  expiresAt,
  cafeName,
  itemName,
  onExpired,
}: {
  code: string;
  expiresAt: string;
  cafeName: string | null;
  itemName: string | null;
  onExpired: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));

  useEffect(() => {
    QRCode.toDataURL(code, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [code]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="notice-box" style={{ textAlign: 'center' }}>
      <div className="label" style={{ marginBottom: 8 }}>
        {itemName ?? 'Your free item'} at {cafeName ?? 'this café'}
      </div>
      {qrDataUrl ? (
        <img src={qrDataUrl} alt={`Redemption QR code ${code}`} width={180} height={180} style={{ margin: '0 auto 12px', display: 'block' }} />
      ) : null}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, letterSpacing: '0.3em', color: 'var(--ceremony)', marginBottom: 8 }}>{code}</div>
      <div style={{ fontSize: 12.5, color: 'var(--whisk)' }}>
        Show staff this screen — expires in {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

function ActivatePicker({ cafes, onActivated }: { cafes: ParticipatingCafe[]; onActivated: () => void }) {
  const [cafeId, setCafeId] = useState('');
  const [itemId, setItemId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedCafe = useMemo(() => cafes.find((c) => c.id === cafeId) ?? null, [cafes, cafeId]);

  function handleCafeChange(id: string) {
    setCafeId(id);
    setItemId('');
  }

  async function activate() {
    if (!cafeId || !itemId) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/rewards/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId, itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not activate.');
      onActivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  if (cafes.length === 0) {
    return <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>No cafés have an eligible item live right now — check back soon.</p>;
  }

  return (
    <div className="notice-box">
      <div className="label" style={{ marginBottom: 10 }}>
        Choose your free item
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <select value={cafeId} onChange={(e) => handleCafeChange(e.target.value)} disabled={busy}>
          <option value="">Pick a café</option>
          {cafes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={busy || !selectedCafe}>
          <option value="">Pick an item</option>
          {selectedCafe?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" disabled={busy || !cafeId || !itemId} onClick={activate} style={{ padding: '10px 20px', fontSize: 13 }}>
          {busy ? 'Activating…' : 'Activate — 10 minutes to redeem'}
        </button>
      </div>
      {error ? <div style={{ fontSize: 12.5, color: 'var(--error, #A8503F)', marginTop: 10 }}>{error}</div> : null}
    </div>
  );
}
