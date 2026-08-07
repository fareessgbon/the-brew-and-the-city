import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isClientAnalyticsEvent } from '@/lib/analyticsEvents';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit';

const MAX_PROPERTIES_BYTES = 4096;
const MAX_EVENTS_PER_MINUTE = 60;

// POST /api/analytics/track — the only write path into analytics_events.
// Not exposed via direct RLS insert (same reasoning as partner_applications
// after migration 0005): validates the event name against the known catalog
// and caps payload size, rather than trusting an arbitrary anon-key insert.
// Attaches the signed-in user's id when there is one; anonymous events
// (hero_quiz_completed, signup_requested before confirmation) are recorded
// with a null user_id rather than rejected.
export async function POST(request: Request) {
  // Unauthenticated by design (hero_quiz_completed and signup_requested both
  // fire before an account exists), so cap by IP to stop one client filling
  // analytics_events. Best-effort — see lib/server/rateLimit.ts. 60/min is
  // far above real usage; the busiest genuine screen fires ~2 events.
  const limit = checkRateLimit(`analytics:${clientIp(request)}`, MAX_EVENTS_PER_MINUTE, 60_000);
  if (!limit.allowed) {
    // Same shape as the success path — a throttled analytics call must not
    // look like a failure to the caller, which never reads this anyway.
    return NextResponse.json({ success: true }, { status: 202 });
  }

  const body = await request.json().catch(() => null);
  // Validated against the *client-writable* subset, not the full catalog:
  // accepting server-only events here let anyone forge portal-login failures
  // (locking a café out of its portal) and money-adjacent partner metrics.
  // See lib/analyticsEvents.ts.
  if (!body || !isClientAnalyticsEvent(body.event)) {
    return NextResponse.json({ error: 'Unknown event.' }, { status: 400 });
  }

  const properties = body.properties && typeof body.properties === 'object' ? body.properties : null;
  if (properties && JSON.stringify(properties).length > MAX_PROPERTIES_BYTES) {
    return NextResponse.json({ error: 'properties payload too large.' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { error } = await admin.from('analytics_events').insert({
    event: body.event,
    user_id: user?.id ?? null,
    properties,
  });

  // Analytics failing should never surface to the visitor — log and 200 anyway.
  if (error) {
    await logServerError('analytics.track', error, { event: body.event }, user?.id ?? null);
  }

  return NextResponse.json({ success: true });
}
