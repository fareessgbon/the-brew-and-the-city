'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Timestamp } from '@/lib/format/relativeTime';
import { CITY_LABELS, PARTNER_STATUS_LABELS, type City, type PartnerStatus } from '@/lib/data/cafeFields';

export interface CafeListRow {
  id: string;
  name: string;
  slug: string;
  city: City;
  neighbourhood: string | null;
  partner_status: string;
  verified_at: string | null;
  updated_at: string;
  missing: string[];
  unscored: boolean;
}

// Filtering, not the completeness sort — that's a triage order the founder
// shouldn't have to reproduce by eye, so it stays server-side (see
// workRemaining in lib/data/cafeFields.ts) and this component only ever
// narrows the rows it was already handed, never reorders them.
export function CafeListClient({ cafes }: { cafes: CafeListRow[] }) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = q
    ? cafes.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.neighbourhood ?? '').toLowerCase().includes(q) ||
          CITY_LABELS[c.city].toLowerCase().includes(q),
      )
    : cafes;

  return (
    <>
      {cafes.length > 6 ? (
        <div className="cafe-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, neighbourhood or city…"
            aria-label="Filter cafés by name, neighbourhood or city"
          />
          {q ? (
            <span className="cafe-search-count">
              {visible.length} of {cafes.length}
            </span>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 ? (
          <div className="admin-empty">
            {q ? `Nothing matches “${query}”.` : 'Cafés you add here are what the homepage quiz matches against. Start with the ones you already know well.'}
          </div>
        ) : null}
        {visible.map((cafe) => (
          <div key={cafe.id} className="admin-card">
            <div className="admin-bar" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 16.5, margin: 0 }}>
                  <Link href={`/admin/cafes/${cafe.id}`} className="admin-card-link">
                    {cafe.name}
                  </Link>
                </h3>
                <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 3 }}>
                  {[
                    CITY_LABELS[cafe.city],
                    cafe.neighbourhood ?? 'No neighbourhood',
                    PARTNER_STATUS_LABELS[cafe.partner_status as PartnerStatus] ?? cafe.partner_status,
                    `/${cafe.slug}`,
                  ].join(' · ')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                <Timestamp iso={cafe.updated_at} />
                {cafe.verified_at ? (
                  <span className="cafe-editor-chip cafe-editor-chip-verified">Verified</span>
                ) : (
                  <span className="cafe-editor-chip">Unverified</span>
                )}
              </div>
            </div>
            {cafe.missing.length > 0 || cafe.unscored ? (
              <div className="cafe-missing">
                Still needs: {[...cafe.missing, cafe.unscored ? 'taste vector not scored' : null].filter(Boolean).join(', ')}
              </div>
            ) : null}
            <Link href={`/admin/cafes/${cafe.id}`} className="admin-open-link">
              Edit this café →
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
