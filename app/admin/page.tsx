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
          <Link href="/admin/merchant-strings" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Receipts</div>
            <h3>Merchant strings</h3>
            <p>Map receipt merchant names to cafés, and watch each café&apos;s approval rate.</p>
          </Link>
          <Link href="/admin/partners" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Partners</div>
            <h3>Partner administration</h3>
            <p>Contract terms, billing, and lifecycle status for every partnered café.</p>
          </Link>
          <Link href="/admin/reimbursements" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">City Card</div>
            <h3>Reimbursements</h3>
            <p>What each café is owed for redeemed rewards, grouped and exportable.</p>
          </Link>
          <Link href="/admin/flags" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Config</div>
            <h3>Feature flags</h3>
            <p>Turn matching, receipts, and rewards on or off, checked server-side.</p>
          </Link>
          <Link href="/admin/audit" className="how-card" style={{ textDecoration: 'none' }}>
            <div className="label num">Config</div>
            <h3>Audit log</h3>
            <p>Every admin change, with who made it and the before/after values.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
