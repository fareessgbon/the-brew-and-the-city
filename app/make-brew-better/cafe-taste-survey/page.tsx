import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CafeTasteVectorForm } from '@/components/CafeTasteVectorForm';

export const metadata: Metadata = pageMetadata({
  title: 'Tell Us About Your Café — Brew and the City',
  description: 'Nine quick questions — the same ones our own matching engine uses — so your café is listed accurately, not guessed at from the outside.',
  canonical: '/make-brew-better/cafe-taste-survey',
});

export default function CafeTasteVectorSurveyPage() {
  return (
    <>
      <SiteHeader current="make-brew-better" />
      <main id="content">
        <section style={{ padding: '48px 0' }}>
          <div className="wrap">
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="eyebrow label">Help shape Brew · For your café</div>
              <h1 className="page-title page-title-sm">Tell us about your café</h1>
              <p style={{ fontSize: 15, color: 'var(--whisk)', marginBottom: 28 }}>
                Nine quick questions, about two minutes — the same ones we&apos;d otherwise have to guess at from a
                menu or a website. Nothing here signs your café up for anything, and someone reviews every answer
                before it goes anywhere near your public listing.
              </p>
              <CafeTasteVectorForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
