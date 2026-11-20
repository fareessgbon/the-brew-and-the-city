import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = pageMetadata({
  title: 'Help shape Brew — Brew and the City',
  description: 'Two short surveys — for cafés and for coffee drinkers — that decide what we actually build.',
  canonical: '/make-brew-better',
});

// §13.6 / §12.1a — reachable from a single nav link, no login, either
// survey answerable in under 3 minutes.
export default function MakeBrewBetterPage() {
  return (
    <>
      <SiteHeader current="make-brew-better" />
      <main id="content">
        <section className="page-head">
          <div className="wrap" style={{ maxWidth: 640 }}>
            <div className="eyebrow label">Help shape Brew</div>
            <h1 className="page-title">
              Before we build anything, we&apos;re asking.
            </h1>
            <p className="page-lede" style={{ marginBottom: 28 }}>
              Two short surveys — one for café owners, one for coffee drinkers. Real answers here decide what we
              build, before any of it is locked in.
            </p>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div className="ratio-box">
                <div className="label" style={{ marginBottom: 8 }}>
                  I own or run a café
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 16 }}>7 steps, about 3 minutes.</p>
                <Link href="/make-brew-better/cafe-partner-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                  Take the café survey
                </Link>
              </div>
              <div className="ratio-box">
                <div className="label" style={{ marginBottom: 8 }}>
                  I drink coffee or matcha in Calgary or Toronto
                </div>
                {/* 6, not 5 — the survey gained a name/email step. This
                    card is the only place that number was hardcoded. */}
                <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 16 }}>6 steps, about 2 minutes.</p>
                <Link href="/make-brew-better/consumer-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                  Take the consumer survey
                </Link>
              </div>
              <div className="ratio-box">
                <div className="label" style={{ marginBottom: 8 }}>
                  I already know I want to be listed
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 16 }}>
                  Nine questions, about 2 minutes — tell us your café&apos;s taste profile directly.
                </p>
                <Link href="/make-brew-better/cafe-taste-survey" className="btn btn-primary" style={{ width: 'auto', display: 'inline-block' }}>
                  Tell us about your café
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
