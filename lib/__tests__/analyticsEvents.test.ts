import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  CLIENT_ANALYTICS_EVENTS,
  isAnalyticsEvent,
  isClientAnalyticsEvent,
} from '../analyticsEvents';

// Guards the Phase 15 fix: POST /api/analytics/track validates against the
// *client* list, so anything that leaks back into it becomes forgeable by
// an unauthenticated browser request.
describe('client analytics event allowlist', () => {
  it('is a strict subset of the full catalog', () => {
    for (const event of CLIENT_ANALYTICS_EVENTS) {
      expect(ANALYTICS_EVENTS).toContain(event);
    }
    expect(CLIENT_ANALYTICS_EVENTS.length).toBeLessThan(ANALYTICS_EVENTS.length);
  });

  it('never accepts events that gate rate limiting or partner money', () => {
    // portal_login_failed is counted by /api/portal/login to decide whether a
    // café is being brute-forced — forgeable rows meant anyone could lock a
    // real café out of its own portal.
    // The rest feed reimbursement figures reported to partners (§3.0.5).
    const serverOnly = [
      'portal_login_failed',
      'portal_login_succeeded',
      'receipt_approved',
      'receipt_rejected',
      'reward_redeemed',
      'reward_activated',
      'reward_earned',
      'reimbursement_marked_paid',
      'cafe_created',
      'reward_item_created',
      'account_created',
      'onboarding_completed',
    ];
    for (const event of serverOnly) {
      expect(isAnalyticsEvent(event)).toBe(true);
      expect(isClientAnalyticsEvent(event)).toBe(false);
    }
  });

  it('still accepts the events real client code fires', () => {
    for (const event of ['hero_quiz_completed', 'signup_requested', 'login_submitted', 'match_viewed']) {
      expect(isClientAnalyticsEvent(event)).toBe(true);
    }
  });

  it('rejects unknown values without throwing', () => {
    for (const value of ['', 'nope', null, undefined, 42, {}]) {
      expect(isClientAnalyticsEvent(value)).toBe(false);
      expect(isAnalyticsEvent(value)).toBe(false);
    }
  });
});
