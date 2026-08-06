// §2.4 — "the Google Maps test": one trust-building line per surface, shown
// only for a visitor's first 3 views, then it gets out of the way.
export function mapsTestLine(key: string, text: string): string {
  if (typeof window === 'undefined') return '';
  const seenKey = `mm_seen_${key}`;
  const seen = parseInt(window.localStorage.getItem(seenKey) ?? '0', 10);
  if (seen >= 3) return '';
  window.localStorage.setItem(seenKey, String(seen + 1));
  return text;
}
