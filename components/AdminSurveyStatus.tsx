'use client';

import { useEffect, useRef, useState } from 'react';
import type { SurveyStatus } from '@/lib/supabase/types';

const STATUS_OPTIONS: SurveyStatus[] = ['new', 'contacted', 'selected', 'declined'];

// Status badge colours, admin-UI convention: grey for untouched, amber for
// in-progress, green for a good outcome, red for a closed-out no.
const STATUS_COLOURS: Record<SurveyStatus, string> = {
  new: 'var(--whisk)',
  contacted: '#b3823f',
  selected: '#3f8b5c',
  declined: '#b3402a',
};

// The card's loudest signal, not its quietest — this used to be an 8px
// dot next to a plain <select>. A <select> styled to look like a solid
// colour pill still IS the edit control (native, keyboard-operable), it
// just also reads as the badge, so there's one element doing both jobs
// instead of a decorative dot plus a form control fighting for attention
// (see chat — "think like a product designer").
export function AdminStatusBadge({ id, initialStatus }: { id: string; initialStatus: SurveyStatus }) {
  const [status, setStatus] = useState<SurveyStatus>(initialStatus);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleChange(next: SurveyStatus) {
    setStatus(next);
    setSaved('saving');
    try {
      const res = await fetch(`/api/admin/survey-responses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setSaved('idle');
    } catch {
      setSaved('error');
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as SurveyStatus)}
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 10px',
        width: 'auto',
        borderRadius: 999,
        border: 'none',
        background: STATUS_COLOURS[status],
        color: '#fff',
        appearance: 'auto',
        opacity: saved === 'error' ? 0.6 : 1,
      }}
      title={saved === 'error' ? 'Failed to save — try again' : undefined}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option[0].toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );
}

// The card body's working field — separate from the badge above so the
// header can stay a single scannable line while this sits with the rest
// of the card's content.
//
// Collapsed until there's something to show. An always-rendered empty
// textarea put roughly 90px of blank box on every card in the queue, so a
// page with a handful of submissions was mostly empty note fields — the
// notes are the exception, not the default state of a row. Cards that
// already have a note open showing it, since that note is worth reading
// without a click.
export function AdminNotesField({
  id,
  initialNotes,
  // The full application page opens the field outright — you went there to
  // work one submission, so the note box is the point rather than clutter.
  alwaysOpen = false,
}: {
  id: string;
  initialNotes: string | null;
  alwaysOpen?: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [open, setOpen] = useState(alwaysOpen || Boolean(initialNotes));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Only focus when the field was opened by a click, never on mount —
  // otherwise every card with an existing note would fight for focus as
  // the page loads.
  const openedByClick = useRef(false);

  useEffect(() => {
    if (open && openedByClick.current) {
      openedByClick.current = false;
      textareaRef.current?.focus();
    }
  }, [open]);

  async function handleBlur() {
    setSaved('saving');
    try {
      const res = await fetch(`/api/admin/survey-responses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (!res.ok) throw new Error();
      setSaved('saved');
      setTimeout(() => setSaved('idle'), 1500);
    } catch {
      setSaved('error');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="admin-note-add"
        onClick={() => {
          openedByClick.current = true;
          setOpen(true);
        }}
      >
        + Add a note
      </button>
    );
  }

  return (
    <div className="admin-notes">
      <textarea
        ref={textareaRef}
        placeholder="Why selected or declined, follow-up needed…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={2}
      />
      {/* Reserved height, so the row of cards doesn't jump when a save
          status appears and clears again. */}
      <span className="admin-notes-status" style={saved === 'error' ? { color: '#b3402a' } : undefined}>
        {saved === 'saving' ? 'Saving…' : saved === 'saved' ? 'Saved' : saved === 'error' ? 'Failed to save' : ''}
      </span>
    </div>
  );
}
