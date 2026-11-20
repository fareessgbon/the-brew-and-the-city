'use client';

import { useEffect, useRef, useState } from 'react';

// Wavy ticker band under the hero: the names run along a curved SVG path
// and scroll by advancing the <textPath>'s startOffset. One set of names is
// measured (a hidden <text>, after the poster font has loaded) so the loop
// wraps at exactly one set's width and the seam is invisible. Callers pass
// real names (HomeContent.tsx feeds it live café names, not invented copy),
// so the whole thing is aria-hidden — the same names surface again in the
// quiz results below, which is the non-decorative place to read them.
const WAVE = 'M-64,90 C 320,25 528,155 864,90 S 1440,25 1664,90';
const SETS = 5;
const SPEED = 64; // viewBox units per second

export function Marquee({ items }: { items: string[] }) {
  const measureRef = useRef<SVGTextElement>(null);
  const pathRef = useRef<SVGTextPathElement>(null);
  // A moving band that never stops fails WCAG 2.2.2 (anything that moves for
  // more than five seconds needs a way to pause it), so there's a real
  // button; the ref lets the animation loop read it without restarting.
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  // A star after every item, including the last, so the loop point reads as
  // the pattern starting over rather than a gap.
  const set = items.map((item) => `${item}  ✳  `).join('');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (!pausedRef.current && width > 0) {
        travelled = (travelled + dt * SPEED) % width;
        pathRef.current?.setAttribute('startOffset', String(-travelled));
      }
      raf = requestAnimationFrame(tick);
    };
    let width = 0;
    let last = 0;
    let travelled = 0;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      width = measureRef.current?.getComputedTextLength() ?? 0;
      if (width > 0) raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [set]);

  return (
    <div className="marquee-wrap">
      <button
        type="button"
        className="marquee-pause"
        aria-pressed={paused}
        aria-label={paused ? 'Play the scrolling banner' : 'Pause the scrolling banner'}
        onClick={() => {
          pausedRef.current = !pausedRef.current;
          setPaused(pausedRef.current);
        }}
      >
        {paused ? '▶' : '❚❚'}
      </button>
      <svg
        className="marquee-svg"
        viewBox="0 0 1600 180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <path id="marquee-wave" d={WAVE} />
        </defs>
        <use href="#marquee-wave" className="marquee-ribbon" />
        <text ref={measureRef} className="marquee-measure" xmlSpace="preserve">
          {set}
        </text>
        <text className="marquee-text" dominantBaseline="central" xmlSpace="preserve">
          <textPath ref={pathRef} href="#marquee-wave" startOffset="0" xmlSpace="preserve">
            {set.repeat(SETS)}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
