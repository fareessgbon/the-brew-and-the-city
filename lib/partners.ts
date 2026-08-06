// §3.0 — six months free for a Founding Partner before the "continue at
// $49 / go Featured / drop to Listed" decision. Shared between the café
// editor and the partner administration screen so both read the same clock.
export const FOUNDING_PERIOD_DAYS = 182;

export function foundingPartnerStatusLine(startedAt: string): string {
  const daysElapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / (24 * 60 * 60 * 1000));
  const daysLeft = FOUNDING_PERIOD_DAYS - daysElapsed;
  if (daysLeft <= 0) return `Free period ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago — due for the $49/Featured/Listed decision (§3.0.6).`;
  if (daysLeft <= 30) return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in the free period — send the performance summary (§3.0.6).`;
  return `${daysLeft} days left in the 6-month free period, started ${new Date(startedAt).toLocaleDateString('en-CA')}.`;
}
