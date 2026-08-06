import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { AdminNav } from '@/components/admin/AdminNav';

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
          <AdminNav email={user.email ?? ''} />
        </div>
      </header>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
