import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PortalSlugForm } from '@/components/portal/PortalSlugForm';

export const metadata: Metadata = {
  title: 'Café portal — Brew and the City',
  description: 'Café staff login for reviewing receipts and redeeming rewards.',
};

export default function PortalIndexPage() {
  return (
    <>
      <SiteHeader />
      <section style={{ padding: '64px 0', minHeight: '50vh' }}>
        <div className="wrap" style={{ maxWidth: 420 }}>
          <div className="label eyebrow">Café portal</div>
          <h1 style={{ fontSize: 30, marginBottom: 8 }}>Find your café</h1>
          <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
            Enter your café&apos;s Brew and the City URL slug (the part after /cafes/ on your listing) to get to your
            portal login. Don&apos;t have a PIN yet? Reach out to us and we&apos;ll set one up.
          </p>
          <PortalSlugForm />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
