// Fire-and-forget funnel event (see app/api/analytics/track). Never throws
// and never blocks: a failed beacon is a lost data point, not a broken page.
export function track(event: string, properties?: { city?: string; step?: number; method?: string }) {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({ event, properties });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/analytics/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    }
  } catch {}
}
