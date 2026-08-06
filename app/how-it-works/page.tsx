import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HowItWorksSection } from '@/components/HowItWorksSection';

export const metadata: Metadata = {
  title: 'How it works — Brew and the City',
  description: 'How Match % actually works — taste fit, context, proximity, and the rule we never break.',
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0 8px' }}>
        <div className="wrap">
          <div className="label eyebrow">How it works</div>
          <h1 style={{ fontSize: 38 }}>Every café gets the same honest number.</h1>
        </div>
      </section>
      <HowItWorksSection />
      <SiteFooter />
    </>
  );
}
