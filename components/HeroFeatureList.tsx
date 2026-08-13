// Sits beside the quiz card, from the hero design pass (see chat). Real
// product features already described elsewhere on this page/site — Match
// %, the City Card — not a new claim; same "01 — Context Fit" mono-number
// convention as HowItWorksSection, so the two don't compete visually.
const FEATURES = [
  {
    num: '01',
    title: 'Skip the star rating',
    body: 'Every café gets its own Match % — ranked by fit, not by a review count pretending to mean something.',
  },
  {
    num: '02',
    title: 'A taste map, not a bucket list',
    body: 'Save cafés to your City List as you find them — it remembers what a bookmark folder never does.',
  },
  {
    num: '03',
    title: 'Friends with taste, not just friends',
    body: 'Weighted by how close their taste is to yours, not by who happened to check in first.',
  },
  {
    num: '04',
    title: 'One card, every café',
    body: 'Five visits anywhere in the network unlock a free item from the café you redeem at — no loyalty app per café.',
  },
];

export function HeroFeatureList() {
  return (
    <div className="feature-list">
      {FEATURES.map((f) => (
        <div className="feature-item" key={f.num}>
          <div className="label num">{f.num}</div>
          <div>
            {/* h2, not h3: these are the first headings after the page h1,
                so h3 skipped a level and broke screen-reader outline order.
                Styling is unchanged — .feature-item h2 carries it. */}
            <h2>{f.title}</h2>
            <p>{f.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
