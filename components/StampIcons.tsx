// The three stamp glyphs for the City Card, all drawn on the same 32×32 grid
// with currentColor so the card's CSS colours them. Every stamp renders all
// three and globals.css shows one, keyed off <html data-stamps> (the dev
// picker flips it) — so the choice between cups, mugs and beans can be made
// by looking at them on the real card rather than imagining it.
const common = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function StampIcons() {
  return (
    <>
      {/* Takeaway cup: lid, tapered body, sleeve. */}
      <svg className="stamp-icon icon-cups" {...common}>
        <path d="M8 8h16" />
        <path d="M9.5 8l1.6 18.2a1.5 1.5 0 0 0 1.5 1.3h6.8a1.5 1.5 0 0 0 1.5-1.3L22.5 8" />
        <path d="M10.4 15h11.2v6H10.7z" fill="currentColor" fillOpacity=".25" />
        <path d="M11 8V6.5A1.5 1.5 0 0 1 12.5 5h7A1.5 1.5 0 0 1 21 6.5V8" />
      </svg>
      {/* Mug: straight body, handle, steam. */}
      <svg className="stamp-icon icon-mugs" {...common}>
        <path d="M7 12h14v9a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" />
        <path d="M21 14h1.5a3 3 0 0 1 0 6H21" />
        <path d="M11 8c-1-1.5 1-2.5 0-4M16 8c-1-1.5 1-2.5 0-4" />
      </svg>
      {/* Coffee bean: oval with the centre crease. */}
      <svg className="stamp-icon icon-beans" {...common}>
        <ellipse cx="16" cy="16" rx="8" ry="11" transform="rotate(35 16 16)" fill="currentColor" fillOpacity=".25" />
        <path d="M11 9.5c4 1.5 3 4.5 4.5 6.5s.5 5-1.5 6.5" transform="rotate(35 16 16) translate(1 0)" />
      </svg>
    </>
  );
}
