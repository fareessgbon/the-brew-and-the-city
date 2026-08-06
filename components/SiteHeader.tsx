'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/nav/SessionProvider';
import { AccountMenu } from '@/components/nav/AccountMenu';
import { MobileMenu } from '@/components/nav/MobileMenu';

const SIGNED_IN_LINKS = [
  ['/today', 'Today'],
  ['/discover', 'Discover'],
  ['/map', 'Map'],
  ['/saved', 'City List'],
  ['/rewards', 'City Card'],
] as const;

export function SiteHeader({ current }: { current?: 'for-cafes' }) {
  const pathname = usePathname();
  const { loading, signedIn } = useSession();

  return (
    <header>
      <div className="wrap">
        <Link className="logo" href="/">
          <span className="en">Brew and the City</span>
        </Link>

        {/* Neutral nav while the session is still being checked — never
            flashes the wrong (signed-in vs signed-out) link set. */}
        {loading ? (
          <nav aria-hidden="true" className="nav-loading" />
        ) : signedIn ? (
          <nav aria-label="Primary" className="nav-signed-in">
            {SIGNED_IN_LINKS.map(([href, label]) => (
              <Link key={href} href={href} className={pathname === href ? 'current' : undefined} aria-current={pathname === href ? 'page' : undefined}>
                {label}
              </Link>
            ))}
            <AccountMenu />
          </nav>
        ) : (
          <nav aria-label="Primary" className="nav-signed-out">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/#sixth-round">City Card</Link>
            <Link href="/for-cafes" className={current === 'for-cafes' ? 'current' : undefined} aria-current={current === 'for-cafes' ? 'page' : undefined}>
              For cafés
            </Link>
            <Link href="/portal">Café Portal</Link>
            <Link href="/login">Log In</Link>
            <Link href="/signup" className="btn btn-primary">
              Get Started
            </Link>
          </nav>
        )}

        {!loading && !signedIn ? <MobileMenu /> : null}
      </div>
    </header>
  );
}
