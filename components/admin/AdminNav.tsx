'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Mirrors components/nav/AccountMenu.tsx's dropdown pattern (and reuses its
// .account-menu-* CSS classes verbatim) — the admin header used to be 9 flat
// nav links plus the admin's email and a sign-out button in one row, with no
// active-page indication and no grouping. Split into the 4 links used in the
// actual day-to-day admin loop (PILOT_READINESS.md: approve an application ->
// manage the café -> review receipts -> mark reimbursements paid) plus a
// "More" dropdown for the rest, which are configuration/oversight tools used
// far less often.
const PRIMARY_LINKS = [
  ['/admin/cafes', 'Cafés'],
  ['/admin/applications', 'Applications'],
  ['/admin/visits', 'Receipts'],
  ['/admin/reimbursements', 'Reimbursements'],
] as const;

const MORE_LINKS = [
  ['/admin/partners', 'Partners'],
  ['/admin/flags', 'Feature flags'],
  ['/admin/merchant-strings', 'Merchant strings'],
  ['/admin/vector-tester', 'Vector tester'],
  ['/admin/audit', 'Audit log'],
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  const moreActive = MORE_LINKS.some(([href]) => isActive(pathname, href));

  return (
    <nav aria-label="Admin" style={{ flexWrap: 'wrap', rowGap: 8 }}>
      {PRIMARY_LINKS.map(([href, label]) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={active ? 'current' : undefined} aria-current={active ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
      <div className="account-menu" ref={containerRef}>
        <button
          type="button"
          ref={buttonRef}
          className="account-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={moreActive ? 'current' : undefined}>More</span>
          <span aria-hidden="true" className="account-menu-caret">
            {open ? '▲' : '▼'}
          </span>
        </button>
        {open ? (
          <div className="account-menu-panel" role="menu">
            {MORE_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                className={isActive(pathname, href) ? 'current' : undefined}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--whisk)', borderTop: '1px solid var(--whisk-10)', marginTop: 4 }}>{email}</div>
            <button type="button" role="menuitem" className="account-menu-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
