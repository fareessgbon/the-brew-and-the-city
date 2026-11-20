'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RECEIPT_ACCEPT, validateReceipt } from '@/lib/visits/receipt';
import { Timestamp } from '@/lib/format/relativeTime';
import type { DiscoverCafe } from '@/components/DiscoverContent';

export interface VisitHistoryRow {
  id: string;
  cafeName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STATUS_LABEL: Record<VisitHistoryRow['status'], string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Not approved',
};

// §8.10 — The City Card. Real stamps, not a self-report: a member uploads
// a receipt photo, which lands in /admin/visits as 'pending' and only
// counts once approved (POST /api/visits, see migration 0020's comment on
// why there's no direct client-side write). This panel shows progress,
// takes the upload, and lists what's happened to every receipt sent in.
export function CityCardPanel({
  cafes,
  stamps,
  stampsRequired,
  activeReward,
  history,
}: {
  cafes: DiscoverCafe[];
  stamps: number;
  stampsRequired: number;
  activeReward: { code: string } | null;
  history: VisitHistoryRow[];
}) {
  const router = useRouter();
  const [cafeId, setCafeId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!cafeId) return setError('Choose which café this receipt is from.');
    if (!file) return setError('Attach a photo of your receipt.');
    const problem = validateReceipt(file);
    if (problem) return setError(problem);

    setStatus('uploading');
    try {
      const form = new FormData();
      form.set('cafeId', cafeId);
      form.set('receipt', file);
      const res = await fetch('/api/visits', { method: 'POST', body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? 'That upload didn’t go through.');
      setCafeId('');
      if (fileRef.current) fileRef.current.value = '';
      setStatus('idle');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That upload didn’t go through.');
      setStatus('idle');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
      <div>
        <p className="section-lede" style={{ margin: '0 0 16px' }}>
          Five visits anywhere in the network. One card, not six punch cards in your wallet.
        </p>
        <div className="stamp-card">
          {Array.from({ length: stampsRequired }, (_, i) => (
            <span key={i} className={`stamp-dot${i < stamps ? ' filled' : ''}`} aria-hidden="true" />
          ))}
        </div>
        {activeReward ? (
          <div className="discover-card" style={{ marginTop: 16 }}>
            <div className="label" style={{ color: 'var(--whisk)', marginBottom: 6 }}>
              Show this at the counter
            </div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 24, letterSpacing: '0.08em', color: 'var(--ceremony)' }}>
              {activeReward.code}
            </div>
            <p className="discover-card-desc" style={{ marginTop: 8 }}>Your free item — any café in the network.</p>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--whisk)', marginTop: 14 }}>
            {/* A single string, not text split across JSX expression
                boundaries — that split silently drops the space next to an
                expression when the text after it wraps onto another line. */}
            {`${stampsRequired - stamps} ${stampsRequired - stamps === 1 ? 'visit' : 'visits'} to go. A stamp lands once a café’s receipt is approved — at most two from the same café.`}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          <div className="label" style={{ color: 'var(--whisk)' }}>Add a visit</div>
          <select
            value={cafeId}
            onChange={(e) => setCafeId(e.target.value)}
            className="taste-select"
            aria-label="Which café"
          >
            <option value="">Which café?</option>
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input ref={fileRef} type="file" accept={RECEIPT_ACCEPT} aria-label="Receipt photo" />
          {error ? <div className="form-note" style={{ color: '#b3402a' }}>{error}</div> : null}
          <button type="submit" className="btn btn-primary" disabled={status === 'uploading'} style={{ width: 'auto', alignSelf: 'flex-start' }}>
            {status === 'uploading' ? 'Uploading…' : 'Upload receipt'}
          </button>
        </form>
      </div>

      <div>
        <div className="label" style={{ color: 'var(--whisk)', marginBottom: 12 }}>
          Your receipts
        </div>
        {history.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--whisk)' }}>Nothing uploaded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'var(--paper)',
                  border: '1px solid var(--paper-2)',
                  borderRadius: 10,
                  padding: '12px 16px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{v.cafeName}</div>
                  <Timestamp iso={v.createdAt} />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: v.status === 'approved' ? 'var(--ceremony)' : v.status === 'rejected' ? '#b3402a' : 'var(--whisk)',
                  }}
                >
                  {STATUS_LABEL[v.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
