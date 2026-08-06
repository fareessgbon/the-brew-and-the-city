'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { RewardItemCategory } from '@/lib/supabase/types';

export interface PendingVisit {
  id: string;
  createdAt: string;
  memberName: string | null;
  memberEmail: string;
  receiptUrl: string | null;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  category: RewardItemCategory;
  price_cents: number | null;
  monthly_cap: number | null;
  is_available: boolean;
}

export interface WeeklyStats {
  stampsThisWeek: number;
  stampsLastWeek: number;
  matchedVisitsEstimateCents: number;
  firstTimeCustomersThisWeek: number;
  rewardsRedeemedThisWeek: number;
  reimbursementOwedCents: number;
  citywideTrendPct: number | null;
}

export interface VisitHistoryEntry {
  id: string;
  status: 'approved' | 'rejected';
  reviewedAt: string | null;
  memberName: string | null;
  memberEmail: string;
}

const PORTAL_NAV = [
  ['#dashboard', 'Portal Dashboard'],
  ['#receipts', 'Pending Receipts'],
  ['#visits', 'Visits'],
  ['#rewards', 'Rewards'],
] as const;

export function PortalDashboard({
  slug,
  cafeId,
  cafeName,
  initialVisits,
  initialRewardItems,
  weeklyStats,
  visitHistory,
}: {
  slug: string;
  cafeId: string;
  cafeName: string;
  initialVisits: PendingVisit[];
  initialRewardItems: RewardItem[];
  weeklyStats: WeeklyStats;
  visitHistory: VisitHistoryEntry[];
}) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function review(visitId: string, action: 'approve' | 'reject') {
    setBusyId(visitId);
    try {
      const res = await fetch(`/api/portal/visits/${visitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setVisits((prev) => prev.filter((v) => v.id !== visitId));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch('/api/portal/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeId }),
    });
    router.push(`/portal/${slug}`);
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="label" style={{ color: 'var(--whisk)' }}>
            Café portal
          </div>
          <h1 style={{ fontSize: 28 }}>{cafeName}</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={logout} style={{ padding: '8px 16px', fontSize: 13 }}>
          Log out
        </button>
      </div>

      <nav aria-label="Portal" className="portal-nav">
        {PORTAL_NAV.map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>

      <div id="dashboard" style={{ scrollMarginTop: 90 }}>
        <WeeklyStatsCard stats={weeklyStats} />
      </div>

      <div id="receipts" style={{ scrollMarginTop: 90 }}>
        <div className="label" style={{ margin: '32px 0 12px' }}>
          Pending receipts ({visits.length})
        </div>
        {visits.length === 0 ? (
          <p style={{ color: 'var(--whisk)', fontSize: 14 }}>Nothing waiting on you right now.</p>
        ) : (
          visits.map((v) => (
            <div key={v.id} className="match-result" style={{ marginBottom: 12 }}>
              <div className="body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.memberName || v.memberEmail}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--whisk)' }}>{new Date(v.createdAt).toLocaleString('en-CA')}</div>
                  </div>
                  {v.receiptUrl ? (
                    <a href={v.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>
                      View receipt →
                    </a>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyId === v.id}
                    onClick={() => review(v.id, 'approve')}
                    style={{ padding: '6px 16px', fontSize: 12.5 }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busyId === v.id}
                    onClick={() => review(v.id, 'reject')}
                    style={{ padding: '6px 16px', fontSize: 12.5 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div id="visits" style={{ scrollMarginTop: 90 }}>
        <div className="label" style={{ margin: '32px 0 12px' }}>
          Recent visits
        </div>
        {visitHistory.length === 0 ? (
          <p style={{ color: 'var(--whisk)', fontSize: 14 }}>No reviewed visits yet — approved and rejected receipts will show up here.</p>
        ) : (
          <div className="ratio-box">
            {visitHistory.map((v) => (
              <div className="ratio-row" key={v.id}>
                <span>
                  {v.memberName || v.memberEmail}
                  {v.reviewedAt ? ` — ${new Date(v.reviewedAt).toLocaleDateString('en-CA')}` : ''}
                </span>
                <span style={{ color: v.status === 'approved' ? 'var(--ceremony)' : 'var(--error, #A8503F)', textTransform: 'capitalize' }}>{v.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="rewards" style={{ scrollMarginTop: 90 }}>
        <RedeemTool cafeId={cafeId} />
        <RewardItemsManager cafeId={cafeId} initialItems={initialRewardItems} />
      </div>
    </div>
  );
}

function RedeemTool({ cafeId }: { cafeId: string }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const code = (form.elements.namedItem('code') as HTMLInputElement).value.trim();
    if (!code) return;

    setStatus('checking');
    try {
      const res = await fetch('/api/portal/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not redeem.');
      setStatus('success');
      setMessage('Redeemed — one free item, on the house.');
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div className="ratio-box">
      <div className="label" style={{ marginBottom: 10 }}>
        Redeem a reward
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          name="code"
          placeholder="4-character code"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--whisk-10)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={status === 'checking'} style={{ padding: '10px 20px', fontSize: 13 }}>
          {status === 'checking' ? 'Checking…' : 'Redeem'}
        </button>
      </form>
      {message ? (
        <div style={{ fontSize: 13, marginTop: 10, color: status === 'success' ? 'var(--ceremony)' : 'var(--error, #A8503F)' }}>{message}</div>
      ) : null}
    </div>
  );
}

const CATEGORY_LABELS: Record<RewardItemCategory, string> = { drink: 'Drink', pastry: 'Pastry', food: 'Food', other: 'Other' };
const MAX_ITEMS = 5;

// §3.0.5 — the café curates up to 5 eligible items for City Card redemption
// each month, rather than the platform promising "any drink." No POS
// integration; this is the entire mechanism.
function RewardItemsManager({ cafeId, initialItems }: { cafeId: string; initialItems: RewardItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function toggleAvailable(item: RewardItem) {
    setBusyId(item.id);
    setError('');
    try {
      const res = await fetch(`/api/portal/reward-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.is_available }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update.');
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    setError('');
    try {
      const res = await fetch(`/api/portal/reward-items/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not remove.');
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem('description') as HTMLInputElement).value.trim();
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value as RewardItemCategory;
    const priceDollars = (form.elements.namedItem('price') as HTMLInputElement).value;
    if (!name) return;

    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/portal/reward-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId,
          name,
          description: description || undefined,
          category,
          priceCents: priceDollars ? Math.round(Number(priceDollars) * 100) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add item.');
      setItems((prev) => [...prev, data.item]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="ratio-box" style={{ marginTop: 16 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        This month&apos;s eligible items ({items.length}/{MAX_ITEMS})
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--whisk)', marginBottom: 12 }}>
        Members redeem one of these for free on their 5th visit. Mark an item unavailable any time without losing
        your Match % or map visibility.
      </p>

      {items.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 12 }}>No eligible items yet — add one below.</p>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--whisk-10)', gap: 12 }}
            >
              <div style={{ opacity: item.is_available ? 1 : 0.5 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {item.name} <span style={{ fontWeight: 400, color: 'var(--whisk)', fontSize: 12 }}>· {CATEGORY_LABELS[item.category]}</span>
                </div>
                {item.description ? <div style={{ fontSize: 12.5, color: 'var(--whisk)' }}>{item.description}</div> : null}
                {item.price_cents != null ? <div style={{ fontSize: 12, color: 'var(--whisk)' }}>Regular price ${(item.price_cents / 100).toFixed(2)}</div> : null}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busyId === item.id}
                  onClick={() => toggleAvailable(item)}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  {item.is_available ? 'Mark unavailable' : 'Mark available'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busyId === item.id}
                  onClick={() => removeItem(item.id)}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length < MAX_ITEMS ? (
        <form onSubmit={handleAdd} className="cafe-signup-form" style={{ maxWidth: 480 }}>
          <div className="field-row">
            <div>
              <label htmlFor="item-name">Item name</label>
              <input type="text" id="item-name" name="name" required />
            </div>
            <div>
              <label htmlFor="item-category">Category</label>
              <select id="item-category" name="category" defaultValue="drink">
                <option value="drink">Drink</option>
                <option value="pastry">Pastry</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div>
              <label htmlFor="item-price">Regular price ($)</label>
              <input type="number" step="0.01" min="0" id="item-price" name="price" />
            </div>
            <div>
              <label htmlFor="item-description">Description</label>
              <input type="text" id="item-description" name="description" placeholder="e.g. 12oz, oat milk included" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding} style={{ padding: '8px 18px', fontSize: 13 }}>
            {adding ? 'Adding…' : 'Add eligible item'}
          </button>
        </form>
      ) : null}
      {error ? <div style={{ fontSize: 12.5, color: 'var(--error, #A8503F)', marginTop: 10 }}>{error}</div> : null}
    </div>
  );
}

// §13.5 — the portal home screen is a live counter, not a menu. Most owners
// never log in past week one; this is what makes the ones who do come back.
function WeeklyStatsCard({ stats }: { stats: WeeklyStats }) {
  const delta = stats.stampsThisWeek - stats.stampsLastWeek;
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const deltaLabel = stats.stampsLastWeek === 0 ? 'first week with data' : `${arrow} ${Math.abs(delta)} from last week`;

  return (
    <div className="round-card" style={{ marginBottom: 24 }}>
      <div className="label" style={{ marginBottom: 4 }}>
        This week
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 1, color: 'var(--ceremony)' }}>{stats.stampsThisWeek}</span>
        <span style={{ fontSize: 13, color: 'var(--whisk)' }}>{deltaLabel}</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 14 }}>visits earned here</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5 }}>
        <div>~${(stats.matchedVisitsEstimateCents / 100).toFixed(0)} in matched visits</div>
        <div>{stats.firstTimeCustomersThisWeek} first-time customer{stats.firstTimeCustomersThisWeek === 1 ? '' : 's'}</div>
        <div>
          {stats.rewardsRedeemedThisWeek} reward{stats.rewardsRedeemedThisWeek === 1 ? '' : 's'} redeemed
          {stats.rewardsRedeemedThisWeek > 0 ? ` ($${(stats.reimbursementOwedCents / 100).toFixed(2)} owed to you)` : ''}
        </div>
      </div>

      {stats.citywideTrendPct !== null ? (
        <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 12, fontStyle: 'italic' }}>
          Citywide traffic is down {Math.abs(stats.citywideTrendPct)}% this week too — not just you.
        </div>
      ) : null}
    </div>
  );
}
