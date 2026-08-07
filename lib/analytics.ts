import type { ClientAnalyticsEvent } from '@/lib/analyticsEvents';

// Fire-and-forget client-side tracking. Never throws, never awaited by
// callers — an analytics call must not be able to break the UI flow it's
// attached to.
//
// Typed to ClientAnalyticsEvent, not the full catalog: server-only events
// (portal_login_failed, reward_redeemed, reimbursement_marked_paid, …) are
// rejected by the route anyway, so this makes that a compile error rather
// than a silently-dropped event at runtime.
export function track(event: ClientAnalyticsEvent, properties?: Record<string, unknown>) {
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
