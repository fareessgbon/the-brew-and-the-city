'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TasteVector } from '@/lib/matching';

// Taste-space, not geography — no café in this build has real coordinates
// wired into matching yet (see lib/scoreCafes.ts), so "map" here means
// where a café sits between bold/unsweetened and sweet/milky, quiet and
// loud. Shared by the homepage quiz's reveal and /discover so the two
// never quietly drift into two different projections of the same data.
export function project(v: TasteVector) {
  const x = v.drink;
  const y = 0.6 * v.energy + 0.4 * (100 - v.pace);
  return { x, y };
}

function toPct(v: number) {
  return Math.max(6, Math.min(94, v));
}

export interface MapCafe {
  id: string;
  name: string;
  vector: TasteVector;
  /** Draws the pink ring the homepage's own top-3 reveal uses. */
  highlight?: boolean;
}

interface ProximityMapProps {
  cafes: readonly MapCafe[];
  /** The visitor's own point, or null before they've answered anything real. */
  you: TasteVector | null;
  /** Which café ids get a persistent name label under their dot — keep this
   * small on a page with many cafés, or the map turns into text soup. */
  showLabelsFor: ReadonlySet<string>;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlap(a: Box, b: Box) {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

const DOT = 14;
const LABEL_H = 22;
const LABEL_GAP = 7;

// Places each label beside its dot on whichever side (below, above, right,
// left) collides least with the dots and the labels already placed, and
// keeps it inside the frame. Names used to be centred under their dots with
// no awareness of each other, so neighbours printed over one another and the
// ones near an edge were cut off by the frame.
function placeLabels(
  items: { id: string; text: string; px: number; py: number }[],
  dots: Box[],
  width: number,
  height: number,
): Map<string, { left: number; top: number }> {
  const placed: Box[] = [];
  const out = new Map<string, { left: number; top: number }>();
  for (const it of items) {
    const w = Math.ceil(it.text.length * 6.9) + 16;
    const candidates: Box[] = [
      { x: it.px - w / 2, y: it.py + DOT / 2 + LABEL_GAP - 3, w, h: LABEL_H },
      { x: it.px - w / 2, y: it.py - DOT / 2 - LABEL_GAP - LABEL_H + 3, w, h: LABEL_H },
      { x: it.px + DOT / 2 + LABEL_GAP, y: it.py - LABEL_H / 2, w, h: LABEL_H },
      { x: it.px - DOT / 2 - LABEL_GAP - w, y: it.py - LABEL_H / 2, w, h: LABEL_H },
    ].map((b) => ({
      ...b,
      x: Math.max(4, Math.min(width - w - 4, b.x)),
      y: Math.max(4, Math.min(height - LABEL_H - 4, b.y)),
    }));
    let best = candidates[0];
    let bestCost = Infinity;
    for (const c of candidates) {
      let cost = 0;
      for (const d of dots) cost += overlap(c, d) * 2;
      for (const p of placed) cost += overlap(c, p) * 4;
      if (cost < bestCost) {
        best = c;
        bestCost = cost;
      }
      if (cost === 0) break;
    }
    placed.push(best);
    out.set(it.id, { left: best.x, top: best.y });
  }
  return out;
}

export function ProximityMap({ cafes, you, showLabelsFor }: ProximityMapProps) {
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- replays the dot-reveal CSS transition post-commit; can't run during render.
    setVisible(false);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [cafes.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const youPoint = you ? project(you) : null;

  const labels = useMemo(() => {
    if (size.w === 0) return new Map<string, { left: number; top: number }>();
    const at = (x: number, y: number) => ({ px: (toPct(x) / 100) * size.w, py: (toPct(100 - y) / 100) * size.h });
    const dots: Box[] = cafes.map((c) => {
      const { px, py } = at(project(c.vector).x, project(c.vector).y);
      return { x: px - DOT / 2, y: py - DOT / 2, w: DOT, h: DOT };
    });
    // The axis captions are obstacles too: the bottom strip carries two of
    // them and the top centre one, and a name printed over a caption is as
    // unreadable as two names on each other.
    dots.push({ x: 0, y: size.h - 28, w: size.w, h: 28 }, { x: size.w / 2 - 50, y: 0, w: 100, h: 24 });
    if (youPoint) {
      const { px, py } = at(youPoint.x, youPoint.y);
      dots.push({ x: px - 9, y: py - 9, w: 18, h: 18 });
    }
    // "You" first so it always gets its best spot, then the highlighted
    // (top-match) cafés, then everything else that's labelled.
    const items = [
      ...(youPoint ? [{ id: 'you', text: 'You', ...at(youPoint.x, youPoint.y) }] : []),
      ...cafes
        .filter((c) => showLabelsFor.has(c.id))
        .sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight))
        .map((c) => ({ id: c.id, text: c.name, ...at(project(c.vector).x, project(c.vector).y) })),
    ];
    return placeLabels(items, dots, size.w, size.h);
  }, [cafes, youPoint, showLabelsFor, size]);

  return (
    <div className="pmap" aria-hidden="true" ref={ref}>
      {/* The ends match project() above: x is the drink dimension (high =
          strong and unsweetened), y is room energy blended with pace (high =
          lively, in-and-out). These were labelled the other way round — bold
          on top, loud on the right — which put every dot under the wrong
          word. */}
      <div className="axis-label axis-top">↑ lively</div>
      <div className="axis-label axis-bottom">quiet ↓</div>
      <div className="axis-label axis-left">← sweet &amp; milky</div>
      <div className="axis-label axis-right">bold &amp; unsweetened →</div>
      <div className="cross-h" />
      <div className="cross-v" />

      {cafes.map((c, i) => {
        const p = project(c.vector);
        return (
          <div
            key={c.id}
            title={c.name}
            className={`pdot cafe${c.highlight ? ' high' : ''}${visible ? ' visible' : ''}`}
            style={{ left: `${toPct(p.x)}%`, top: `${toPct(100 - p.y)}%`, transitionDelay: `${i * 40}ms` }}
          />
        );
      })}
      {cafes
        .filter((c) => showLabelsFor.has(c.id) && labels.has(c.id))
        .map((c) => (
          <div
            key={`${c.id}-label`}
            className={`pdot-label${c.highlight ? ' high' : ''}${visible ? ' visible' : ''}`}
            style={labels.get(c.id)}
          >
            {c.name}
          </div>
        ))}

      {youPoint ? (
        <>
          <div
            className={`pdot you${visible ? ' visible' : ''}`}
            style={{ left: `${toPct(youPoint.x)}%`, top: `${toPct(100 - youPoint.y)}%`, zIndex: 5 }}
          />
          {labels.has('you') ? (
            <div className={`pdot-label you${visible ? ' visible' : ''}`} style={labels.get('you')}>
              You
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
