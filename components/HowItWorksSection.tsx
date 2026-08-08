// Shared by the homepage's #how anchor section and the standalone
// /how-it-works page, so the two never drift out of sync.
export function HowItWorksSection({ id }: { id?: string } = {}) {
  return (
    <section id={id} className="how-section">
      <div className="wrap">
        <div className="section-eyebrow label">How it works</div>
        <h2 className="section-title">We stopped ranking cafés. We started matching them.</h2>
        <p className="section-lede">
          Two people can both be right that a café is a 5 and a 2. Your taste profile — drink, energy, aesthetic,
          pace, adventure, price, food — gets compared to every café&apos;s, need, flavour, distance, and friends, in
          that order.
        </p>
        {/* Ordered, because the scoring is ordered — the lede says these
            apply "in that order" and that need leads. <ol> says the same
            thing to a screen reader that the numbered rail says visually. */}
        <ol className="how-grid">
          <li className="how-card">
            <div className="num">01</div>
            <div className="how-kicker label">Context Fit</div>
            <h3>What you need, right now</h3>
            <p>
              Deep work, a date, a quick fix, catching up — we ask what you&apos;re after before what you like. A
              perfect flavour match with no outlets and a line out the door is still a bad call, so need leads the
              score.
            </p>
          </li>
          <li className="how-card">
            <div className="num">02</div>
            <div className="how-kicker label">Taste Fit</div>
            <h3>Your Taste</h3>
            <p>Nine quick questions build your drink category and a 7-dimension taste vector. It&apos;s yours to see and edit any time, never a black box.</p>
          </li>
          <li className="how-card">
            <div className="num">03</div>
            <div className="how-kicker label">Proximity</div>
            <h3>Worth the trip</h3>
            <p>
              Anything within a kilometre scores the same — close enough that taste decides, not metres. Past that
              it fades gradually, faster in winter, so a 90% match across town doesn&apos;t quietly bury a 90% match
              next door.
            </p>
          </li>
          <li className="how-card">
            <div className="num">04</div>
            <div className="how-kicker label">Social Proof</div>
            <h3>Friends with taste like yours</h3>
            <p>Friends are weighted by taste similarity, not by friendship. Your friend with terrible taste doesn&apos;t move your matches.</p>
          </li>
        </ol>
        <div className="firewall-banner">
          <div className="firewall-mark">✓</div>
          <div>
            <div className="firewall-title">The rule we don&apos;t break</div>
            <div className="firewall-copy">
              Cafés can pay to be listed, featured, or entered into the City Card. They can never pay for a better
              Match %. Every café in Calgary gets the same honest number, partner or not — that&apos;s the only
              reason this app is worth trusting more than a review site.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
