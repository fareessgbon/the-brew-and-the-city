import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { SignOutButton } from '@/app/profile/SignOutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'static' }}>
        <div className="wrap">
          <Link className="logo" href="/admin">
            <span className="en">Brew and the City</span>
            <span className="ja" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              admin
            </span>
          </Link>
          <nav style={{ flexWrap: 'wrap', rowGap: 8 }}>
            <Link href="/admin/cafes">Cafés</Link>
            <Link href="/admin/visits">Receipts</Link>
            <Link href="/admin/vector-tester">Vector tester</Link>
            <Link href="/admin/merchant-strings">Merchant strings</Link>
            <Link href="/admin/partners">Partners</Link>
            <Link href="/admin/reimbursements">Reimbursements</Link>
            <Link href="/admin/flags">Feature flags</Link>
            <Link href="/admin/applications">Applications</Link>
            <Link href="/admin/audit">Audit log</Link>
            <span className="label" style={{ color: 'var(--whisk)' }}>
              {user.email}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
