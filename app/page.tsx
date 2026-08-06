import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WaitlistForm } from '@/components/WaitlistForm';

// §0.4 / §12.1a — the pre-launch hero. No live quiz here, deliberately: a
// mini-quiz that resolves to "your top match" needs seeded cafés and a
// working scoring function, and this phase has neither. Say the idea in
// one screen instead, and ask for one thing — an email.
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <section className="hero" id="waitlist">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="eyebrow label">Calgary, Alberta</div>
          <h1>Matched to your next favourite café, before Calgary finds it.</h1>
          <p className="lede">
            Calgary has 60+ independent cafés. Brew and the City is building a way to match you to yours — by taste,
            not by review count.
          </p>
          <WaitlistForm />
          <div className="form-note" style={{ marginTop: 24 }}>
            Café owner? <Link href="/for-cafes">See the Founding Partner pitch →</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
