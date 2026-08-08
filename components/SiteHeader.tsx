import Link from 'next/link';

// §0.4 / §12.1a — the entire nav: no "Sign Up," no "Log In." Every item
// goes somewhere a visitor can act on without an account. "For Cafés" was
// previously footer-only; added here too so the café pitch isn't a click
// a café owner has to already know to look for.
export function SiteHeader({ current }: { current?: 'for-cafes' | 'make-brew-better' }) {
  return (
    <header>
      <div className="wrap">
        <Link className="logo" href="/">
          <span className="en">Brew and the City</span>
        </Link>
        <nav aria-label="Primary">
          <Link href="/for-cafes" className={current === 'for-cafes' ? 'current' : undefined} aria-current={current === 'for-cafes' ? 'page' : undefined}>
            For Cafés
          </Link>
          <Link href="/make-brew-better" className={current === 'make-brew-better' ? 'current' : undefined} aria-current={current === 'make-brew-better' ? 'page' : undefined}>
            Make Brew Better
          </Link>
          {/* The visible label no longer names the destination, and this
              leaves the site for Instagram in a new tab. aria-label keeps
              "Instagram" and the new-tab warning available to screen
              readers, who otherwise get a link that gives no clue where it
              goes or that focus is about to move. */}
          <a
            href="https://instagram.com/brewandthecity"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="See what we're brewing on Instagram (opens in a new tab)"
          >
            See What We&apos;re Brewing
          </a>
        </nav>
      </div>
    </header>
  );
}
