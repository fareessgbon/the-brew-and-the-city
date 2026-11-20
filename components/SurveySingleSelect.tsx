'use client';

// The single-choice sibling of SurveyMultiSelect (§13.6) — same clickable-
// row visual language, radio semantics instead of checkbox, since the
// café taste-vector survey's seven questions are each "pick the one that's
// truest," not "choose up to N."
export function SurveySingleSelect<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (next: T) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1.5px solid ${checked ? 'var(--ceremony)' : 'var(--whisk-10)'}`,
              background: checked ? 'var(--ceremony)' : 'transparent',
              color: checked ? 'var(--paper)' : 'var(--ink)',
              fontSize: 14,
              fontWeight: checked ? 600 : 400,
              cursor: 'pointer',
              transition: 'background 150ms, border-color 150ms, color 150ms',
            }}
          >
            {/* Visually hidden, not display:none — same reasoning as
                SurveyMultiSelect: stays in the tab order, keeps its
                accessible name/state, native radio-group keyboard nav
                (arrow keys) still works. */}
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
