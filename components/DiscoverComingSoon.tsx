import Link from 'next/link';

// What a signed-out visitor sees at /discover instead of a login prompt
// (see chat) — the sign-in flow itself is built and working, but hasn't had
// enough real usage yet to put in front of cold traffic the day after its
// first real test needed an SMTP fix. /login stays fully reachable by
// direct URL for that continued testing; nothing here links to it.
export function DiscoverComingSoon() {
  return (
    <section className="page-head" style={{ padding: '96px 0' }}>
      <div className="wrap" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div className="section-eyebrow label">Discover</div>
        <h1 className="page-title" style={{ marginInline: 'auto' }}>
          Browsing by taste is coming soon.
        </h1>
        <p className="section-lede" style={{ margin: '10px 0 28px' }}>
          We&apos;re still making sure sign-in works the way it should before opening this up. Join the waitlist and
          we&apos;ll let you know the moment it&apos;s ready — you&apos;ll be first in line either way.
        </p>
        <Link href="/#waitlist" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
          Join the waitlist
        </Link>
      </div>
    </section>
  );
}
