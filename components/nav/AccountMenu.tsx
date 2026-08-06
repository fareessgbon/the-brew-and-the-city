'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSession } from './SessionProvider';

export function AccountMenu() {
  const router = useRouter();
  const { isAdmin } = useSession();
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

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        type="button"
        ref={buttonRef}
        className="account-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Account
        <span aria-hidden="true" className="account-menu-caret">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open ? (
        <div className="account-menu-panel" role="menu">
          <Link href="/profile#taste" role="menuitem" onClick={() => setOpen(false)}>
            Your Taste
          </Link>
          <Link href="/profile#account-security" role="menuitem" onClick={() => setOpen(false)}>
            Account Settings
          </Link>
          <Link href="/onboarding/quiz" role="menuitem" onClick={() => setOpen(false)}>
            Retake Quiz
          </Link>
          {isAdmin ? (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)}>
              Admin Dashboard
            </Link>
          ) : null}
          <button type="button" role="menuitem" className="account-menu-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
