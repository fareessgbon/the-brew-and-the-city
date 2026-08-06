import Link from 'next/link';

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
          <Link href="/how-it-works">How it works</Link>
          <Link href="/#sixth-round">The City Card</Link>
          <Link href="/for-cafes">For cafés</Link>
          <Link href="/portal">Café login</Link>
          <Link href="/#signup">Get started</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://instagram.com/brewandthecity">Instagram</a>
        </div>
        <div className="footer-tag">© 2026 Brew and the City · Calgary, AB</div>
      </div>
    </footer>
  );
}
