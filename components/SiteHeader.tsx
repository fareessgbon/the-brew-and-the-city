import Link from 'next/link';

// §0.4 / §12.1a — the entire nav, copied because it's correct: two links,
// no "Sign Up," no "Log In." Every item goes somewhere a visitor can act on
// without an account.
export function SiteHeader({ current }: { current?: 'for-cafes' | 'help-shape-the-app' }) {
  return (
    <header>
      <div className="wrap">
        <Link className="logo" href="/">
          <span className="en">Brew and the City</span>
        </Link>
        <nav aria-label="Primary">
          <Link href="/help-shape-the-app" className={current === 'help-shape-the-app' ? 'current' : undefined} aria-current={current === 'help-shape-the-app' ? 'page' : undefined}>
            Help Shape the App
          </Link>
          <a href="https://instagram.com/brewandthecity" target="_blank" rel="noopener noreferrer">
            Catch Us on Instagram
          </a>
        </nav>
      </div>
    </header>
  );
}
