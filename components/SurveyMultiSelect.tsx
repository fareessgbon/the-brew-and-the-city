'use client';

// Shared by both surveys (§13.6) for their "choose up to N" questions.
// Built as one scrolling form with labelled sections rather than a
// stateful step-by-step wizard — same content structure the spec
// describes ("5 steps, ~3 minutes"), simpler to build and verify
// correctly than a JS wizard, and no less usable for a one-time survey.
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
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none', opacity: disabled ? 0.5 : 1 }}
          >
            <input type="checkbox" name={name} value={option} checked={checked} disabled={disabled} onChange={() => toggle(option)} style={{ width: 'auto' }} />
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
