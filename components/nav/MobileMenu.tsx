'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const LINKS: { href: string; label: string }[] = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/#sixth-round', label: 'City Card' },
  { href: '/for-cafes', label: 'For Cafés' },
  { href: '/portal', label: 'Café Portal' },
  { href: '/login', label: 'Log In' },
  { href: '/signup', label: 'Get Started' },
];

// Signed-out mobile nav. Signed-in customers get the bottom nav instead
// (see MobileBottomNav) — this component only ever renders the marketing
// link set.
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('mobile-menu-open');
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        ref={buttonRef}
        className="mobile-menu-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`hamburger${open ? ' open' : ''}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && mounted
        ? createPortal(
            <>
              <button type="button" className="mobile-menu-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />
              <div ref={panelRef} className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Site menu">
                <nav aria-label="Primary">
                  {LINKS.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
