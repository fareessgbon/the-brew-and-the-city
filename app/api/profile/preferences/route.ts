import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CALGARY_NEIGHBOURHOODS } from '@/lib/data/neighbourhoods';
import { PRIMARY_DRINK_CATEGORIES } from '@/lib/matching';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';
import type { Database } from '@/lib/supabase/types';

type TasteProfileUpdate = Database['public']['Tables']['taste_profiles']['Update'];

interface PreferencesBody {
  radiusKm?: unknown;
  worthTrip?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  neighbourhood?: unknown;
  clearLocation?: unknown;
  primaryDrinkCategory?: unknown;
  needsNonDairy?: unknown;
  needsGlutenFree?: unknown;
  needsWheelchair?: unknown;
}

function parseLatLng(lat: unknown, lng: unknown): { latitude: number; longitude: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

// POST /api/profile/preferences — partial update to the signed-in user's
// taste_profiles row: travel radius, worth-the-trip, and/or location (GPS,
// a picked neighbourhood, or explicitly cleared). Only the fields present in
// the body are touched; omitted ones are left as they were.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as PreferencesBody;
  const update: TasteProfileUpdate = {};

  if (body.radiusKm !== undefined) {
    const radius = Number(body.radiusKm);
    if (!Number.isFinite(radius) || radius < 0 || radius > 50) {
      return NextResponse.json({ error: 'Radius must be between 0 and 50 km.' }, { status: 400 });
    }
    update.radius_km = radius;
  }

  if (body.worthTrip !== undefined) {
    if (typeof body.worthTrip !== 'boolean') {
      return NextResponse.json({ error: 'worthTrip must be true or false.' }, { status: 400 });
    }
    update.worth_the_trip = body.worthTrip;
  }

  if (body.primaryDrinkCategory !== undefined) {
    if (!PRIMARY_DRINK_CATEGORIES.includes(body.primaryDrinkCategory as (typeof PRIMARY_DRINK_CATEGORIES)[number])) {
      return NextResponse.json({ error: 'Unrecognized drink category.' }, { status: 400 });
    }
    update.primary_drink_category = body.primaryDrinkCategory as (typeof PRIMARY_DRINK_CATEGORIES)[number];
  }

  for (const [bodyKey, column] of [
    ['needsNonDairy', 'needs_non_dairy'],
    ['needsGlutenFree', 'needs_gluten_free'],
    ['needsWheelchair', 'needs_wheelchair'],
  ] as const) {
    if (body[bodyKey] !== undefined) {
      if (typeof body[bodyKey] !== 'boolean') {
        return NextResponse.json({ error: `${bodyKey} must be true or false.` }, { status: 400 });
      }
      update[column] = body[bodyKey];
    }
  }

  const coords = parseLatLng(body.latitude, body.longitude);
  let locationMethod: 'gps' | 'neighbourhood' | 'cleared' | null = null;
  if (body.clearLocation === true) {
    update.home_latitude = null;
    update.home_longitude = null;
    update.home_neighbourhood = null;
    locationMethod = 'cleared';
  } else if (coords) {
    update.home_latitude = coords.latitude;
    update.home_longitude = coords.longitude;
    update.home_neighbourhood = null;
    locationMethod = 'gps';
  } else if (typeof body.neighbourhood === 'string' && body.neighbourhood) {
    const match = CALGARY_NEIGHBOURHOODS.find((n) => n.name === body.neighbourhood);
    if (!match) {
      return NextResponse.json({ error: 'Unrecognized neighbourhood.' }, { status: 400 });
    }
    update.home_latitude = match.latitude;
    update.home_longitude = match.longitude;
    update.home_neighbourhood = match.name;
    locationMethod = 'neighbourhood';
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { error } = await supabase.from('taste_profiles').update(update).eq('user_id', user.id);
  if (error) {
    await logServerError('api.profile.preferences', error, { userId: user.id, update }, user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (locationMethod) {
    await trackServerEvent('location_saved', user.id, { method: locationMethod, via: 'preferences' });
  }

  return NextResponse.json({ success: true });
}
