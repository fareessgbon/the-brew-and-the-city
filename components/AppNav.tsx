import Link from 'next/link';

const LINKS = [
  ['/today', 'Today'],
  ['/discover', 'Discover'],
  ['/map', 'Map'],
  ['/saved', 'City List'],
  ['/rewards', 'City Card'],
  ['/profile', 'Your Taste'],
] as const;

export function AppNav({ current }: { current: (typeof LINKS)[number][0] }) {
  return (
    <nav aria-label="Section" className="tabs-row" style={{ maxWidth: 640, margin: '0 auto 24px' }}>
      {LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`tab-btn${href === current ? ' active' : ''}`}
          aria-current={href === current ? 'page' : undefined}
          style={{ textDecoration: 'none' }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
