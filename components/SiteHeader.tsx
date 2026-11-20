'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { CitySwitcher } from '@/components/CityProvider';

type Current = 'discover' | 'for-cafes' | 'make-brew-better' | 'careers';

// The nav links, shared between the desktop row and the mobile drawer so
// the two can't drift apart. onNavigate fires on every click (including
// the Instagram one, which opens a new tab but should still close the
// drawer behind it) — the desktop row just doesn't pass one.
//
// §0.4 / §12.1a mostly still holds: every item except Discover goes
// somewhere a visitor can act on without an account. Discover became a
// deliberate, informed exception (see chat, proxy.ts) — so unlike before,
// the nav does now carry a sign-in control. "For Cafés" was previously
// footer-only; added here too so the café pitch isn't a click a café owner
// has to already know to look for.
//
// One slot, not two: signed out it reads "Sign in" → /login; signed in it
// reads "Your account" → /discover, which by then is rendering the full
// tabbed dashboard (Today/Discover/Map/City List/City Card/Your Taste),
// not a second link to the same page as a static "Discover" item would be.
function NavLinks({
  current,
  loggedIn,
  onSignOut,
  onNavigate,
}: {
  current?: Current;
  loggedIn: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* "Sign in" only appears once there's a session to show. Signed out,
          the public Discover page says browsing is coming soon, so a Sign in
          link at the top of every page offered a door with nothing visibly
          behind it. /login stays reachable from the footer. */}
      {loggedIn ? (
        <Link
          href="/discover"
          className={current === 'discover' ? 'current' : undefined}
          aria-current={current === 'discover' ? 'page' : undefined}
          onClick={onNavigate}
        >
          Your account
        </Link>
      ) : null}
      <Link
        href="/for-cafes"
        className={current === 'for-cafes' ? 'current' : undefined}
        aria-current={current === 'for-cafes' ? 'page' : undefined}
        onClick={onNavigate}
      >
        For Cafés
      </Link>
      <Link
        href="/make-brew-better"
        className={current === 'make-brew-better' ? 'current' : undefined}
        aria-current={current === 'make-brew-better' ? 'page' : undefined}
        onClick={onNavigate}
      >
        Help shape Brew
      </Link>
      {/* Footer-only until now, which put an open role two clicks from
          anywhere and one of them un-guessable. Last in the row, and
          last in the mobile drawer too — hiring matters to fewer
          visitors than anything above it. */}
      <Link
        href="/careers"
        className={current === 'careers' ? 'current' : undefined}
        aria-current={current === 'careers' ? 'page' : undefined}
        onClick={onNavigate}
      >
        Careers
      </Link>
      {/* Sign out is its own control, separate from the link above — that
          one navigates to the account, this one leaves it. Only shown
          once signed in. */}
      {loggedIn ? (
        <button
          type="button"
          className="nav-auth-link"
          onClick={() => {
            onNavigate?.();
            onSignOut();
          }}
        >
          Log out
        </button>
      ) : null}
    </>
  );
}

export function SiteHeader({ current }: { current?: Current }) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const close = () => setOpen(false);

  // Only feeds the nav's Log in/Log out control — never a gate itself
  // (proxy.ts + the /discover page's own check do that server-side). Kept
  // live via onAuthStateChange so signing in on /login or out from here
  // updates every header on screen without a full reload.
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(data.user !== null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(session !== null));
    return () => subscription.unsubscribe();
  }, []);

  function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.signOut().then(() => router.push('/'));
  }

  // While the drawer is open: lock body scroll so the page behind it can't
  // scroll with a thumb, close on Escape, and send focus into the drawer
  // so keyboard/screen-reader users land inside it instead of on a toggle
  // that's still technically focusable but visually gone.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header>
        {/* First focusable thing on every page, and invisible until it's
            focused — without it a keyboard or screen-reader user tabs the
            whole nav again on every page before reaching the content. Each
            page wraps its own content in <main id="content"> as the target. */}
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div className="wrap">
          <Link className="logo" href="/">
            <span className="en">Brew and the City</span>
          </Link>
          <nav aria-label="Primary">
            <NavLinks current={current} loggedIn={loggedIn} onSignOut={handleSignOut} />
          </nav>
          {/* Persistent nav CTA, from the reference design pass (see chat)
              — real destination (the homepage's own #waitlist form), not a
              product action that doesn't exist yet. Desktop only: the
              mobile drawer already ends on the same links, and a second
              pill button next to the hamburger crowded the 44px touch
              targets on a phone-width bar. */}
          <CitySwitcher />
          <Link href="/#waitlist" className="btn btn-primary nav-cta">
            Join the waitlist
          </Link>
          {/* Mobile only (see globals.css @media max-width:720px) — the row
              above hides there and this opens the drawer below instead. */}
          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
      {/* Backdrop + sliding panel, siblings of <header> rather than
          nested in it: header's backdrop-filter makes it a containing
          block for its own fixed-position descendants, which pinned an
          earlier version of this drawer to the header's own ~56px box
          instead of the viewport. Both stay in the DOM at every width —
          closed is an off-screen transform plus `inert`, not a
          mount/unmount, so the drawer can animate open instead of
          popping in. */}
      <div className="mobile-nav-overlay" data-open={open} onClick={close} aria-hidden="true" />
      <div
        id={panelId}
        ref={panelRef}
        className="mobile-nav-panel"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
      >
        <div className="mobile-nav-head">
          <button type="button" className="mobile-nav-close" aria-label="Close menu" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav aria-label="Primary">
          <NavLinks current={current} loggedIn={loggedIn} onSignOut={handleSignOut} onNavigate={close} />
        </nav>
        <CitySwitcher />
        <Link href="/#waitlist" className="btn btn-primary mobile-nav-cta" onClick={close}>
          Join the waitlist
        </Link>
      </div>
    </>
  );
}
