import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <div className="label eyebrow">Admin</div>
        <h1 style={{ fontSize: 30, marginBottom: 24 }}>Dashboard</h1>
        <div className="how-grid">
          <Link href="/admin/cafes" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Catalogue</div>
            <h3>Cafés</h3>
            <p>Add, edit, or bulk-import cafés and their taste vectors.</p>
          </Link>
          <Link href="/admin/vector-tester" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Debug</div>
            <h3>Vector tester</h3>
            <p>Try a taste vector against every café and see the live match scores.</p>
          </Link>
          <Link href="/admin/applications" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Partners</div>
            <h3>Applications</h3>
            <p>Review and approve or reject Founding Partner applications.</p>
          </Link>
          <Link href="/admin/visits" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">City Card</div>
            <h3>Receipts</h3>
            <p>Backup receipt review, and purge photos 30+ days after resolution.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
