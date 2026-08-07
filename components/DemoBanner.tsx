// Legal/trust safeguard, not a dev artifact — real café names appear on
// this site before every one of them has necessarily been visited and
// verified in person (see cafes.verified_at), so this disclaims implied
// partnership until that's true. `show` is computed from real data in
// app/page.tsx (false once every café currently listed is verified) so
// this stops rendering on its own as real, verified partners come on —
// nobody has to remember to delete it.
export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="demo-banner">
      <strong>Product demo.</strong> Café names are real Calgary businesses; taste profiles and match
      percentages are illustrative placeholders for this demo, not verified data, and imply no partnership or
      endorsement.
    </div>
  );
}
