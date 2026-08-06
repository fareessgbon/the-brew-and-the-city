import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import type { AnalyticsEvent } from '@/lib/analyticsEvents';

// Direct-insert tracking for Server Components / Route Handlers — avoids a
// wasteful self-fetch to /api/analytics/track when already running
// server-side. Client Components use lib/analytics.ts's track() instead.
export async function trackServerEvent(event: AnalyticsEvent, userId: string | null, properties?: Record<string, unknown>) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('analytics_events').insert({ event, user_id: userId, properties: properties ?? null });
    if (error) await logServerError('trackServerEvent', error, { event });
  } catch (err) {
    await logServerError('trackServerEvent', err, { event });
  }
}
