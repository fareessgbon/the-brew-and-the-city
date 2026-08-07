// The small walking-coffee-bean mascot from the hero design pass (see
// chat) — the first, simplest version, kept deliberately plain rather
// than the more detailed redraw that was tried and rejected. Purely
// decorative, so it's aria-hidden; the real content is the text beside it.
export function BeanMascot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform="translate(20,4) rotate(-6 50 70)">
        {/* back leg */}
        <path d="M58 108 L46 138 L36 138" stroke="#3a2c24" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* front leg */}
        <path d="M66 110 L70 140 L82 142" stroke="#3a2c24" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* back arm */}
        <path d="M46 78 L26 96 L14 92" stroke="#3a2c24" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* front arm, raised */}
        <path d="M76 76 L96 60 L104 66" stroke="#3a2c24" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* bean body */}
        <ellipse cx="60" cy="82" rx="34" ry="42" fill="#f4efe4" stroke="#3a2c24" strokeWidth="4" />
        {/* bean crease */}
        <path
          d="M60 46 C 50 60, 68 68, 58 82 C 50 94, 66 100, 60 118"
          stroke="#3a2c24"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* face */}
        <circle cx="47" cy="74" r="3" fill="#3a2c24" />
        <circle cx="70" cy="72" r="3" fill="#3a2c24" />
        <path d="M48 90 Q 58 98 68 88" stroke="#3a2c24" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
      {/* motion lines */}
      <path d="M4 150 L22 150" stroke="#3a2c24" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <path d="M0 158 L16 158" stroke="#3a2c24" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
