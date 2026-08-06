import Link from 'next/link';

// §0.4 — footer repeats the nav plus Join the Waitlist, For Cafés, and the
// legal pages. Nothing here requires an account.
export function SiteFooter() {
  return (
    <footer>
      <div className="wrap footer-row">
        <Link className="logo" href="/">
          <span className="en" style={{ fontSize: 16 }}>
            Brew and the City
          </span>
        </Link>
        <div className="footer-links">
          <Link href="/help-shape-the-app">Help Shape the App</Link>
          <a href="https://instagram.com/brewandthecity" target="_blank" rel="noopener noreferrer">
            Catch Us on Instagram
          </a>
          <Link href="/#waitlist">Join the Waitlist</Link>
          <Link href="/for-cafes">For Cafés</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className="footer-tag">© 2026 Brew and the City · Calgary, AB</div>
      </div>
    </footer>
  );
}
