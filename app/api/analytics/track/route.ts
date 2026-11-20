import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit';

// First-party funnel events (table: analytics_events, migration 0007). An
// allowlist, not free text: a public endpoint that stores whatever it's sent
// is a way to fill a table with junk. Properties are limited to a couple of
// short, non-identifying fields — never an email or a name.
const EVENTS = new Set([
  'city_selected',
  'quiz_started',
  'quiz_completed',
  'waitlist_joined',
  'waitlist_shared',
]);
const PROP_KEYS = ['city', 'step', 'method'];

export async function POST(request: Request) {
  if (!checkRateLimit(`track:${clientIp(request)}`, 60, 60_000).allowed) {
    return new NextResponse(null, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const event = typeof body?.event === 'string' ? body.event : '';
  if (!EVENTS.has(event)) return new NextResponse(null, { status: 400 });

  const properties: Record<string, string | number> = {};
  for (const key of PROP_KEYS) {
    const value = body?.properties?.[key];
    if (typeof value === 'string') properties[key] = value.slice(0, 40);
    else if (typeof value === 'number' && Number.isFinite(value)) properties[key] = value;
  }

  try {
    await createAdminClient().from('analytics_events').insert({ event, properties });
  } catch {
    // Analytics must never surface an error to the visitor.
  }
  return new NextResponse(null, { status: 204 });
}
