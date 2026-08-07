// Shown until every café currently listed has actually been visited and
// verified in person (app/page.tsx computes `show`) — the neighbourhood
// chips are seeded from real Calgary businesses, but nothing shown implies
// a partnership or verification that doesn't exist yet. Data-driven rather
// than a manual toggle so nobody has to remember to remove it.
export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="demo-banner">
      <strong>Preview.</strong> The neighbourhoods shown are seeded from real Calgary cafés, but no café listed here
      has been visited and verified yet, and none has partnered with us — this implies no endorsement.
    </div>
  );
}
