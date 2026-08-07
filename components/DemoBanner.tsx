// Shown until every café currently listed has actually been visited and
// verified in person (app/page.tsx computes `show`) — a real café name
// with a placeholder taste profile implies a partnership/verification that
// doesn't exist yet, and this is the disclosure for that. Data-driven
// rather than a manual toggle so nobody has to remember to remove it.
export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="demo-banner">
      <strong>Preview.</strong> Café names are real Calgary businesses; taste profiles and match percentages are
      illustrative placeholders for this preview, not verified data, and imply no partnership or endorsement.
    </div>
  );
}
