import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CALGARY_NEIGHBOURHOODS } from '@/lib/data/neighbourhoods';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';

interface LocationBody {
  latitude?: number;
  longitude?: number;
  neighbourhood?: string;
}

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// POST /api/profile/location — body is one of:
//   { latitude, longitude }        — shared GPS
//   { neighbourhood }              — picked from the list, resolved to an approximate centroid
//   {}                             — "continue without location", clears any previous value
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as LocationBody;

  let update: { home_latitude: number | null; home_longitude: number | null; home_neighbourhood: string | null };
  let method: 'gps' | 'neighbourhood' | 'skipped';

  if (isValidLatLng(body.latitude, body.longitude)) {
    update = { home_latitude: body.latitude!, home_longitude: body.longitude!, home_neighbourhood: null };
    method = 'gps';
  } else if (typeof body.neighbourhood === 'string') {
    const match = CALGARY_NEIGHBOURHOODS.find((n) => n.name === body.neighbourhood);
    if (!match) {
      return NextResponse.json({ error: 'Unrecognized neighbourhood.' }, { status: 400 });
    }
    update = { home_latitude: match.latitude, home_longitude: match.longitude, home_neighbourhood: match.name };
    method = 'neighbourhood';
  } else {
    update = { home_latitude: null, home_longitude: null, home_neighbourhood: null };
    method = 'skipped';
  }

  // The location step is the true end of onboarding (quiz → requirements →
  // location) — reached here means the whole sequence is done, whether the
  // member shared real coordinates or explicitly skipped this step.
  const { error } = await supabase.from('taste_profiles').update({ ...update, onboarding_completed: true }).eq('user_id', user.id);
  if (error) {
    await logServerError('api.profile.location', error, { userId: user.id, method }, user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await trackServerEvent('location_saved', user.id, { method });

  return NextResponse.json({ success: true });
}
