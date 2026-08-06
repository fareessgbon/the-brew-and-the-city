import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ConsumerSurveyForm } from '@/components/ConsumerSurveyForm';

export const metadata: Metadata = {
  title: 'Consumer Survey — Brew and the City',
  description: 'Six steps, about two minutes — tell us how you actually find and choose cafés.',
};

export default function ConsumerSurveyPage() {
  return (
    <>
      <SiteHeader current="help-shape-the-app" />
      <section style={{ padding: '48px 0' }}>
        <div className="wrap">
          <div className="eyebrow label">Help shape the app · Consumer survey</div>
          <h1 style={{ fontSize: 30, marginBottom: 8 }}>How do you actually find cafés?</h1>
          <p style={{ fontSize: 15, color: 'var(--whisk)', marginBottom: 28, maxWidth: '56ch' }}>
            Six steps, about two minutes. No account, no email required.
          </p>
          <ConsumerSurveyForm />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
