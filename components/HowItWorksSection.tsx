// Shared by the homepage's #how anchor section and the standalone
// /how-it-works page, so the two never drift out of sync.
const STEPS = [
  {
    num: '01',
    label: 'Discover',
    title: 'Find cafés that feel like you.',
    body: 'Tell us what you like — from your go-to drink to your ideal atmosphere — and discover cafés that match.',
  },
  {
    num: '02',
    label: 'Build',
    title: 'Create your coffee roster.',
    body: 'Save the places you love, the places you want to try, and everything in between.',
  },
  {
    num: '03',
    label: 'Connect',
    title: 'Make coffee a shared experience.',
    body: 'Send your finds to friends, compare rosters, and discover your next café together.',
  },
  {
    num: '04',
    label: 'Unlock',
    title: 'Get more from your city.',
    // "Sip Club" was swapped for the City Card — that's the real reward
    // mechanic this product has (see #sixth-round on the homepage).
    body: 'The City Card gives you access to exclusive café perks and experiences.',
  },
];

export function HowItWorksSection({ id }: { id?: string } = {}) {
  return (
    <section id={id} className="how-section">
      <div className="wrap">
        <div className="section-eyebrow label">How it works</div>
        <h2 className="section-title">How Brew &amp; the City works</h2>
        <p className="section-lede">Your taste. Your cafés. Your city.</p>
        <div className="how-grid">
          {STEPS.map((step) => (
            <div className="how-card" key={step.num}>
              <div className="label num">
                <b>{step.num}</b> {step.label}
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
