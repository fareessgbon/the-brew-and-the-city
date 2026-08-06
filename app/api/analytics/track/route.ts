import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAnalyticsEvent } from '@/lib/analyticsEvents';
import { logServerError } from '@/lib/server/logError';

const MAX_PROPERTIES_BYTES = 4096;

// POST /api/analytics/track — the only write path into analytics_events.
// Not exposed via direct RLS insert (same reasoning as partner_applications
// after migration 0005): validates the event name against the known catalog
// and caps payload size, rather than trusting an arbitrary anon-key insert.
// Attaches the signed-in user's id when there is one; anonymous events
// (hero_quiz_completed, signup_requested before confirmation) are recorded
// with a null user_id rather than rejected.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !isAnalyticsEvent(body.event)) {
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
