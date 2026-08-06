import type { AnalyticsEvent } from '@/lib/analyticsEvents';

// Fire-and-forget client-side tracking. Never throws, never awaited by
// callers — an analytics call must not be able to break the UI flow it's
// attached to.
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties }),
    keepalive: true,
  }).catch(() => {
    // Best-effort — losing an analytics event is not worth surfacing to the user.
  });
}
