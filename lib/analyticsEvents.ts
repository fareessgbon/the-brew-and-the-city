// The full event catalog — both lib/analytics.ts (client) and
// app/api/analytics/track/route.ts (server) validate against this, so an
// event name can't silently drift into a typo that never gets recorded.
export const ANALYTICS_EVENTS = [
  'hero_quiz_completed',
  'signup_requested',
  'login_submitted',
  'password_reset_requested',
  'account_created',
  'full_quiz_completed',
  'location_saved',
  'context_selected',
  'match_viewed',
  'cafe_profile_opened',
  'cafe_saved',
  'directions_clicked',
  'not_it_submitted',
  'not_it_undone',
  'partner_application_submitted',
  // City Card
  'receipt_submitted',
  'receipt_approved',
  'receipt_rejected',
  'reward_earned',
  'reward_activated',
  'reward_redeemed',
  'portal_login_succeeded',
  'portal_login_failed',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === 'string' && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}
