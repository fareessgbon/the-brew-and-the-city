import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CafePartnerSurveyForm } from '@/components/CafePartnerSurveyForm';

export const metadata: Metadata = {
  title: 'Café Partner Survey — Brew and the City',
  description: 'Five steps, about three minutes — tell us what would make this worth it for your café.',
};

export default function CafePartnerSurveyPage() {
  return (
    <>
      <SiteHeader current="help-shape-the-app" />
      <section style={{ padding: '48px 0' }}>
        <div className="wrap">
          <div className="eyebrow label">Help shape the app · Café survey</div>
          <h1 style={{ fontSize: 30, marginBottom: 8 }}>Tell us about your café</h1>
          <p style={{ fontSize: 15, color: 'var(--whisk)', marginBottom: 28, maxWidth: '56ch' }}>
            Five steps, about three minutes. This isn&apos;t an application — nothing here signs your café up for
            anything.
          </p>
          <CafePartnerSurveyForm />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
