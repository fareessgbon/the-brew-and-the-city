'use client';

import { useState } from 'react';

// Development-only helper (rendered from app/layout.tsx only when
// NODE_ENV === 'development'). Lets you click through candidate colours for
// the quiz answer buttons (.opt). It only injects a <style> tag in your
// browser — nothing is saved, and a refresh resets it.
const OPTIONS = [
  { name: 'Current', color: null },
  { name: 'Sage', color: '#dfe6cf' },
  { name: 'Blush', color: '#f1dcd2' },
  { name: 'Powder blue', color: '#d9e6ef' },
  // From the Pinterest palette "a grounded & whimsical color palette"
  // (hexes read off the pin image, so approximate).
  { name: 'Sea Pink', color: '#e096ac' },
  { name: 'Crystal Blue', color: '#a6c8dc' },
  { name: 'Lemon Icing', color: '#fff3d1' },
] as const;

// Quiz section backgrounds. Built from the active palette's tokens, so they
// follow whichever whole-site palette is selected.
const BACKGROUNDS = [
  { name: 'Stripes (current)', css: null },
  { name: 'Soft gradient', css: 'linear-gradient(180deg, var(--paper) 0%, var(--latte) 100%)' },
  {
    name: 'Polka dots',
    css: 'radial-gradient(var(--latte-2) 4px, transparent 4.5px) 0 0 / 32px 32px, var(--latte)',
  },
  {
    name: 'Checkerboard',
    css: 'conic-gradient(var(--latte) 25%, var(--latte-2) 0 50%, var(--latte) 0 75%, var(--latte-2) 0) 0 0 / 72px 72px',
  },
  {
    name: 'Gingham',
    css: 'repeating-linear-gradient(0deg, transparent 0 24px, rgba(255,255,255,.4) 24px 48px), repeating-linear-gradient(90deg, var(--latte) 0 24px, var(--latte-2) 24px 48px)',
  },
] as const;

const PALETTES = [
  { name: 'Site default', id: 'cocoa' },
  { name: 'La Buque', id: 'la-buque' },
  { name: 'Blossom & moss', id: 'blossom-moss' },
] as const;

export default function DevColorPicker() {
  const [active, setActive] = useState<string>('Current');
  const [palette, setPalette] = useState<string>('cocoa');

  const [bg, setBg] = useState<string>('Stripes (current)');

  function pickBg(name: string, css: string | null) {
    setBg(name);
    let style = document.getElementById('dev-bg-preview');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dev-bg-preview';
      document.head.appendChild(style);
    }
    style.textContent = css ? `#quiz { background: ${css} !important; }` : '';
  }

  function pickPalette(id: string) {
    setPalette(id);
    document.documentElement.setAttribute('data-palette', id);
  }

  function pick(name: string, color: string | null) {
    setActive(name);
    let style = document.getElementById('dev-color-preview');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dev-color-preview';
      document.head.appendChild(style);
    }
    style.textContent = color ? `.opt { background: ${color} !important; }` : '';
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: '#2b3127',
        color: '#fff',
        borderRadius: 14,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        font: '600 12px system-ui, sans-serif',
        boxShadow: '0 6px 20px rgba(0,0,0,.3)',
      }}
    >
      <div style={{ opacity: 0.7 }}>Whole-site palette</div>
      {PALETTES.map(({ name, id }) => (
        <button
          key={id}
          type="button"
          onClick={() => pickPalette(id)}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: palette === id ? '2px solid #fff' : '2px solid transparent',
            background: 'rgba(255,255,255,.1)',
            color: '#fff',
            cursor: 'pointer',
            font: 'inherit',
            textAlign: 'left',
          }}
        >
          {name}
        </button>
      ))}
      <div style={{ opacity: 0.7, marginTop: 6 }}>Quiz background</div>
      {BACKGROUNDS.map(({ name, css }) => (
        <button
          key={name}
          type="button"
          onClick={() => pickBg(name, css)}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: bg === name ? '2px solid #fff' : '2px solid transparent',
            background: 'rgba(255,255,255,.1)',
            color: '#fff',
            cursor: 'pointer',
            font: 'inherit',
            textAlign: 'left',
          }}
        >
          {name}
        </button>
      ))}
      <div style={{ opacity: 0.7, marginTop: 6 }}>Quiz button colour</div>
      {OPTIONS.map(({ name, color }) => (
        <button
          key={name}
          type="button"
          onClick={() => pick(name, color)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 999,
            border: active === name ? '2px solid #fff' : '2px solid transparent',
            background: 'rgba(255,255,255,.1)',
            color: '#fff',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: color ?? '#e5d9c0',
              border: '1px solid rgba(255,255,255,.5)',
            }}
          />
          {name}
        </button>
      ))}
    </div>
  );
}
