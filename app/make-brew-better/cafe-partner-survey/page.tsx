import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CafePartnerSurveyForm } from '@/components/CafePartnerSurveyForm';

export const metadata: Metadata = pageMetadata({
  title: 'Café Partner Survey — Brew and the City',
  description: 'Seven steps, about three minutes — tell us what would make this worth it for your café.',
  canonical: '/make-brew-better/cafe-partner-survey',
});

export default function CafePartnerSurveyPage() {
  return (
    <>
      <SiteHeader current="make-brew-better" />
      <main id="content">
        <section style={{ padding: '48px 0' }}>
          <div className="wrap">
            {/* Centered column, same width as the form itself below, so the
                heading/lede sit flush with the form's edges instead of
                spanning the full wrap while the form sits narrower. */}
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="eyebrow label">Make Brew Better · Café survey</div>
              <h1 style={{ fontSize: 30, marginBottom: 8 }}>Tell us about your café</h1>
              <p style={{ fontSize: 15, color: 'var(--whisk)', marginBottom: 28 }}>
                Seven steps, about three minutes. This isn&apos;t an application — nothing here signs your café up for
                anything.
              </p>
              <CafePartnerSurveyForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
