import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Help Shape the App — Brew and the City',
  description: "Two short surveys — for cafés and for coffee drinkers — that decide what we actually build.",
};

// §13.6 / §12.1a — reachable from a single nav link, no login, either
// survey answerable in under 3 minutes.
export default function HelpShapeTheAppPage() {
  return (
    <>
      <SiteHeader current="help-shape-the-app" />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="eyebrow label">Help shape the app</div>
          <h1 style={{ fontSize: 36, marginBottom: 12 }}>Before we build anything, we&apos;re asking.</h1>
          <p style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 32, maxWidth: '56ch' }}>
            Two short surveys — one for café owners, one for coffee drinkers. Real answers here decide the
            reimbursement rate, the pricing, and which perks actually matter, before a line of matching code gets
            written.
          </p>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="ratio-box">
              <div className="label" style={{ marginBottom: 8 }}>
                I own or run a café
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 16 }}>7 steps, about 3 minutes.</p>
              <Link href="/help-shape-the-app/cafe-partner-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                Take the café survey
              </Link>
            </div>
            <div className="ratio-box">
              <div className="label" style={{ marginBottom: 8 }}>
                I drink coffee or matcha in Calgary
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 16 }}>5 steps, about 2 minutes.</p>
              <Link href="/help-shape-the-app/consumer-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                Take the consumer survey
              </Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
