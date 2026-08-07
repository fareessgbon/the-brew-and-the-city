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
  'onboarding_completed',
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
  // Admin / partner operations
  'cafe_created',
  'reward_item_created',
  'reimbursement_marked_paid',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === 'string' && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

// The subset a *browser* is allowed to submit via POST /api/analytics/track.
// Every other event in the catalog is written server-side only, through
// trackServerEvent(), and accepting it from an unauthenticated request body
// would be a real vulnerability rather than just messy data:
//
//   • `portal_login_failed` is what app/api/portal/login/route.ts counts to
//     decide whether a café's portal is being brute-forced. When any visitor
//     could POST that event with an arbitrary `slug`, ten forged requests
//     locked a real café out of its own portal for 15 minutes — repeatable
//     indefinitely, with no account needed.
//   • `reimbursement_marked_paid`, `reward_redeemed`, `receipt_approved` and
//     `cafe_created` feed the numbers shown to café partners and used to
//     decide what BREW AND THE CITY owes them (§3.0.5). Forgeable
//     money-adjacent metrics are worth more to an attacker than clean ones
//     are to us.
//
// Adding a new client-fired event means adding it here *and* to the catalog
// above; track() below won't type-check otherwise.
export const CLIENT_ANALYTICS_EVENTS = [
  'hero_quiz_completed',
  'signup_requested',
  'login_submitted',
  'password_reset_requested',
  'context_selected',
  'match_viewed',
  'directions_clicked',
] as const satisfies readonly AnalyticsEvent[];

export type ClientAnalyticsEvent = (typeof CLIENT_ANALYTICS_EVENTS)[number];

export function isClientAnalyticsEvent(value: unknown): value is ClientAnalyticsEvent {
  return typeof value === 'string' && (CLIENT_ANALYTICS_EVENTS as readonly string[]).includes(value);
}
