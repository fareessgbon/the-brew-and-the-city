const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export type OpeningHours = Partial<Record<(typeof DAY_KEYS)[number], [string, string]>>;

// Returns null when there's no hours data to judge by — callers should treat
// that as "unknown", not "closed".
export function isOpenNow(hours: OpeningHours | null | undefined, now: Date = new Date()): boolean | null {
  if (!hours) return null;
  const today = hours[DAY_KEYS[now.getDay()]];
  if (!today) return false; // hours exist for the café, just not today — genuinely closed

  const [open, close] = today;
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}
