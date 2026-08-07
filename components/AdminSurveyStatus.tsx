'use client';

import { useState } from 'react';
import type { SurveyStatus } from '@/lib/supabase/types';

const STATUS_OPTIONS: SurveyStatus[] = ['new', 'contacted', 'selected', 'declined'];

// Status badge colours, admin-UI convention (see chat, "similar to the
// launch site admin"): grey for untouched, amber for in-progress, green
// for a good outcome, red for a closed-out no.
const STATUS_COLOURS: Record<SurveyStatus, string> = {
  new: 'var(--whisk)',
  contacted: '#b3823f',
  selected: '#3f8b5c',
  declined: '#b3402a',
};

export function AdminSurveyStatus({
  id,
  initialStatus,
  initialNotes,
}: {
  id: string;
  initialStatus: SurveyStatus;
  initialNotes: string | null;
}) {
  const [status, setStatus] = useState<SurveyStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function patch(body: Record<string, unknown>) {
    setSaved('saving');
    try {
      const res = await fetch(`/api/admin/survey-responses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setSaved('saved');
      setTimeout(() => setSaved('idle'), 1500);
    } catch {
      setSaved('error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: STATUS_COLOURS[status],
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value as SurveyStatus;
            setStatus(next);
            patch({ status: next });
          }}
          style={{ fontSize: 13, padding: '4px 8px', width: 'auto' }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option[0].toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 11.5, color: 'var(--whisk)' }}>
          {saved === 'saving' ? 'Saving…' : saved === 'saved' ? 'Saved' : saved === 'error' ? 'Failed to save' : ''}
        </span>
      </div>
      <textarea
        placeholder="Notes — e.g. why selected/declined, follow-up needed"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => patch({ adminNotes: notes })}
        rows={2}
        style={{ width: '100%', fontSize: 13 }}
      />
    </div>
  );
}
