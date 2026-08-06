'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ContextKey } from '@/lib/matching';
import { track } from '@/lib/analytics';
import { memberFetch } from '@/lib/client/memberFetch';

interface Match {
  id: string;
  name: string;
  slug: string;
  neighbourhood: string | null;
  pct: number;
  reason: string | null;
  distanceMetres: number | null;
  openNow: boolean | null;
}

const CONTEXT_OPTIONS: { key: ContextKey; label: string }[] = [
  { key: 'study', label: 'Deep work' },
  { key: 'date', label: 'A date' },
  { key: 'quick', label: 'A quick stop' },
  { key: 'catchup', label: 'Catching up' },
];

export function TodayMatches() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [worthTheTrip, setWorthTheTrip] = useState<Match[]>([]);
  const [error, setError] = useState('');
  const [context, setContext] = useState<ContextKey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the context-keyed fetch below as in flight.
    setLoading(true);
    const query = context ? `?context=${context}` : '';
    memberFetch(`/api/matches${query}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load matches.');
        setMatches(data.matches);
        setWorthTheTrip(data.worthTheTrip ?? []);
        setError('');
        if (data.matches?.length > 0) {
          track('match_viewed', { context, count: data.matches.length, topCafeId: data.matches[0]?.id });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Something went wrong.'))
      .finally(() => setLoading(false));
  }, [context]);

  if (error) {
    return (
      <div className="notice-box">
        {error}{' '}
        <Link href="/onboarding/quiz" className="btn btn-primary" style={{ marginLeft: 8, padding: '6px 14px', fontSize: 13 }}>
          Take the quiz
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="label" style={{ marginBottom: 8 }}>
        What do you need?
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {CONTEXT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={context === opt.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => {
              const next = context === opt.key ? null : opt.key;
              setContext(next);
              if (next) track('context_selected', { context: next });
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!matches ? (
        <p style={{ color: 'var(--whisk)' }}>Loading your matches…</p>
      ) : (
        <MatchList matches={matches} worthTheTrip={worthTheTrip} loading={loading} />
      )}
    </div>
  );
}

function MatchList({ matches, worthTheTrip, loading }: { matches: Match[]; worthTheTrip: Match[]; loading: boolean }) {
  const [top, ...rest] = matches;
  const anyKnownDistance = matches.some((m) => m.distanceMetres !== null);

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
      {top ? (
        <div className="round-card" style={{ marginBottom: 24 }}>
          <div className="label">Match of the day</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 26 }}>{top.name}</h2>
            <span className="motd-pct">{top.pct}% match</span>
          </div>
          <div style={{ color: 'var(--whisk)', fontSize: 14, marginTop: 4 }}>
            {top.openNow != null ? (
              <strong style={{ color: top.openNow ? 'var(--ceremony)' : 'var(--error, #A8503F)' }}>{top.openNow ? 'Open now' : 'Closed right now'}</strong>
            ) : null}
            {top.neighbourhood ? ` · ${top.neighbourhood}` : ''}
            {top.distanceMetres != null ? ` · ${(top.distanceMetres / 1000).toFixed(1)} km` : ''}
          </div>
          {top.openNow === false ? (
            <div className="match-disclaimer" style={{ margin: '6px 0 0', textAlign: 'left' }}>
              Nothing open beat this match right now — it&apos;s still the best fit, just not open this minute.
            </div>
          ) : null}
          <div style={{ fontSize: 15, marginTop: 8 }}>{top.reason}</div>
        </div>
      ) : (
        <p style={{ color: 'var(--whisk)', marginBottom: 16 }}>Nothing in range right now — try widening your radius from your profile.</p>
      )}

      {!anyKnownDistance ? (
        <div className="match-disclaimer" style={{ marginBottom: 16 }}>
          No home location set yet, so this is taste and need only — add one from onboarding to bring proximity in.
        </div>
      ) : null}

      <div>
        {rest.map((m, i) => (
          <div className="match-result" key={m.id}>
            <div className="rank">#{i + 2}</div>
            <div className="body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="name">
                  {m.name} <span style={{ fontWeight: 400, color: 'var(--whisk)', fontSize: 13 }}>— {m.neighbourhood}</span>
                  {m.openNow === false ? <span style={{ fontWeight: 400, color: 'var(--error, #A8503F)', fontSize: 12 }}> · Closed</span> : null}
                </span>
                <span className="pct">{m.pct}% match</span>
              </div>
              <div className="why">{m.reason}</div>
            </div>
          </div>
        ))}
      </div>

      {worthTheTrip.length > 0 ? (
        <div style={{ marginTop: 32 }}>
          <div className="label" style={{ marginBottom: 4 }}>
            Worth the trip
          </div>
          <p style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 12 }}>
            Outside your radius, but exceptional enough to mention anyway.
          </p>
          {worthTheTrip.map((m) => (
            <div className="match-result" key={m.id} style={{ borderStyle: 'dashed' }}>
              <div className="body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="name">
                    {m.name}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--whisk)', fontSize: 13 }}>
                      — {m.neighbourhood}
                      {m.distanceMetres != null ? ` · ${(m.distanceMetres / 1000).toFixed(1)} km away` : ''}
                    </span>
                  </span>
                  <span className="pct">{m.pct}% match</span>
                </div>
                <div className="why">{m.reason}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
