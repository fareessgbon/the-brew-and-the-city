'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from './SessionProvider';

const ITEMS = [
  ['/today', 'Today'],
  ['/discover', 'Discover'],
  ['/map', 'Map'],
  ['/saved', 'Saved'],
  ['/profile', 'Account'],
] as const;

const EXCLUDED_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth', '/onboarding', '/admin', '/portal'];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { loading, signedIn, onboardingCompleted } = useSession();

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const visible = !loading && signedIn && onboardingCompleted && !excluded;

  // Pages need room at the bottom so the fixed bar never covers content —
  // toggled on <body> rather than per-page, since this component is the
  // only place that knows whether the bar is actually showing right now.
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', visible);
    return () => document.body.classList.remove('has-bottom-nav');
  }, [visible]);

  if (!visible) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {ITEMS.map(([href, label]) => {
        const isActive = pathname === href;
        return (
          <Link key={href} href={href} className={`mobile-bottom-nav-item${isActive ? ' active' : ''}`} aria-current={isActive ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
