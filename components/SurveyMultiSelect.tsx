'use client';

// Shared by both surveys (§13.6) for their "choose up to N" questions.
// Renders as clickable rows, not a visible checkbox list — the checkbox
// input is still there (keeps native keyboard/screen-reader semantics,
// since a <label> forwards clicks to it), just visually hidden, with
// selection state shown by the row's own background/border instead (see
// chat: "no checkbox, just click the text").
export function SurveyMultiSelect({
  name,
  options,
  selected,
  onChange,
  max,
}: {
  name: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const atMax = max != null && selected.length >= max;

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else if (!atMax) {
      onChange([...selected, option]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((option) => {
        const checked = selected.includes(option);
        const disabled = !checked && atMax;
        return (
          <label
            key={option}
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
              textTransform: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'background 150ms, border-color 150ms, color 150ms',
            }}
          >
            {/* Visually hidden, not display:none — stays in the tab order
                and keeps its accessible name/state for screen readers and
                keyboard users, who never see the checkbox glyph either
                way. */}
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(option)}
              style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
            />
            {option}
          </label>
        );
      })}
      {max != null ? (
        <div style={{ fontSize: 12, color: 'var(--whisk)' }}>
          {selected.length}/{max} selected
        </div>
      ) : null}
    </div>
  );
}
