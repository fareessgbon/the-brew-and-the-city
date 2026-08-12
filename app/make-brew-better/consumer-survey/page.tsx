import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ConsumerSurveyForm } from '@/components/ConsumerSurveyForm';

export const metadata: Metadata = {
  title: 'Consumer Survey — Brew and the City',
  description: 'Six steps, about two minutes — tell us how you actually find and choose cafés.',
  alternates: { canonical: '/make-brew-better/consumer-survey' },
};

export default function ConsumerSurveyPage() {
  return (
    <>
      <SiteHeader current="make-brew-better" />
      <main id="content">
        <section style={{ padding: '48px 0' }}>
          <div className="wrap">
            {/* Centered column, same width as the form itself below — same
                treatment as the café survey page (see chat). */}
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="eyebrow label">Make Brew Better · Consumer survey</div>
              <h1 style={{ fontSize: 30, marginBottom: 8 }}>How do you actually find cafés?</h1>
              <p style={{ fontSize: 15, color: 'var(--whisk)', marginBottom: 28 }}>
                Six steps, about two minutes. Just your name — email optional, no account needed.
              </p>
              <ConsumerSurveyForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
