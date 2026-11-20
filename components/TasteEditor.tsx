'use client';

import { useEffect, useRef, useState } from 'react';
import { DIMS, LABELS, clampDim, type Dim, type TasteVector } from '@/lib/matching';
import { loadTasteState, saveTasteState } from '@/lib/localTaste';

// Your Taste — §8's "seven dimensions, all editable." Saves to
// taste_profiles (PUT /api/account/taste) debounced, and mirrors the same
// value into localStorage (lib/localTaste.ts) so the Discover tab's own,
// independent read of that storage — and the homepage quiz, if this
// visitor goes back to it — stay in step with a slider moved here instead
// of drifting into two different "current taste" values.
export function TasteEditor({ initial, answeredDims }: { initial: TasteVector; answeredDims: Dim[] }) {
  const [vector, setVector] = useState<TasteVector>(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function scheduleSave(next: TasteVector) {
    setStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/account/taste', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) throw new Error('save failed');
        // Preserve whatever the homepage quiz already stored for the
        // fields this editor doesn't touch — overwriting them with null
        // would erase a real drink-category/context answer the next time
        // that quiz reads this same storage key.
        const existing = loadTasteState();
        saveTasteState({
          vector: next,
          answeredDims,
          primaryDrinkCategory: existing?.primaryDrinkCategory ?? null,
          context: existing?.context ?? null,
        });
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 500);
  }

  function handleChange(dim: (typeof DIMS)[number], value: number) {
    const next = { ...vector, [dim]: clampDim(value) };
    setVector(next);
    scheduleSave(next);
  }

  return (
    <div className="taste-editor">
      {DIMS.map((dim) => (
        <div className="taste-slider-row" key={dim}>
          <div className="taste-slider-labels">
            <span>{LABELS[dim].low}</span>
            <span>{LABELS[dim].high}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={vector[dim]}
            onChange={(e) => handleChange(dim, Number(e.target.value))}
            className="taste-slider"
            aria-label={`${LABELS[dim].low} to ${LABELS[dim].high}`}
          />
        </div>
      ))}
      <div className="taste-editor-status">
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved.' : status === 'error' ? "Didn't save — try again." : ''}
      </div>
    </div>
  );
}
