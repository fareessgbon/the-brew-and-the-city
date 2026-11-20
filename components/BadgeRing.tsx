'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// The text ring on the hero badge: one continuous loop of text, read
// clockwise from 9 o'clock, with every letter placed by hand so the spacing
// is identical all the way round. (<textPath> + textLength spreads text
// differently per browser and can overrun the path, which is what made the
// old ring look lumpy.) Each letter is measured, then the leftover
// circumference is divided into equal gaps after every letter. The bottom
// half reads upside down — that's what a single ring does, and it's the
// classic badge look.

const CX = 60;
const CY = 60;
const R = 46;
/** Widths are measured at this size, then the real size is scaled to fit. */
const BASE_SIZE = 10;
const MAX_SIZE = 15;
/** Share of the circumference the letters themselves may fill. */
const FILL = 0.9;
const FONT_STYLE = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: 0,
} as const;

export function BadgeRing({ text: rawText }: { text: string }) {
  const text = rawText.toUpperCase();
  const chars = Array.from(text);
  const measureRef = useRef<SVGTextElement>(null);
  const [widths, setWidths] = useState<number[]>(() => chars.map(() => 6));

  useLayoutEffect(() => {
    let cancelled = false;
    function measure() {
      const el = measureRef.current;
      if (!el || cancelled) return;
      // SVG drops trailing whitespace, so the last character(s) may be out
      // of range — give them the width of a normal space instead.
      const count = el.getNumberOfChars();
      const spaceIdx = chars.findIndex((c, i) => c === ' ' && i < count);
      const spaceW = spaceIdx >= 0 ? el.getSubStringLength(spaceIdx, 1) : 3;
      const next = chars.map((c, i) => (i < count ? el.getSubStringLength(i, 1) : c === ' ' ? spaceW : 0));
      if (next.every((w) => Number.isFinite(w) && w > 0)) setWidths(next);
    }
    measure();
    // Re-measure once the poster font has actually loaded.
    document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chars is derived from text
  }, [text]);

  const circumference = 2 * Math.PI * R;
  const totalBase = widths.reduce((a, b) => a + b, 0);
  // Biggest text that still leaves even breathing room round the ring.
  const fontSize = Math.min((circumference * FILL * BASE_SIZE) / totalBase, MAX_SIZE);
  const scale = fontSize / BASE_SIZE;
  const total = totalBase * scale;
  // Equal gap after every character, including the last, so the loop closes
  // with the same spacing as everywhere else.
  const gap = Math.max((circumference - total) / chars.length, 0);

  let travelled = 0;
  return (
    <>
      {/* Hidden copy, used only to measure each letter's real width. */}
      <text
        ref={measureRef}
        className="badge-text"
        style={{ ...FONT_STYLE, fontSize: BASE_SIZE }}
        visibility="hidden"
      >
        {text}
      </text>
      {chars.map((ch, i) => {
        const w = widths[i] * scale;
        const centre = travelled + w / 2;
        travelled += w + gap;
        if (ch === ' ') return null;
        // Start at 9 o'clock (phi = 180°) and go clockwise over the top.
        const phi = Math.PI + centre / R;
        const x = CX + R * Math.cos(phi);
        const y = CY + R * Math.sin(phi);
        const rot = (phi * 180) / Math.PI + 90;
        return (
          <text
            key={i}
            className="badge-text"
            style={{ ...FONT_STYLE, fontSize }}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})`}
          >
            {ch}
          </text>
        );
      })}
    </>
  );
}
