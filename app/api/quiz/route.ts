import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DIMS, PRIMARY_DRINK_CATEGORIES, clampDim, isValidVector, type Dim, type PrimaryDrinkCategory } from '@/lib/matching';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';

interface QuizSubmission {
  vector: Record<Dim, number>;
  answeredDims: Dim[];
  radiusKm: number;
  worthTrip: boolean;
  primaryDrinkCategory: PrimaryDrinkCategory | null;
  needsNonDairy: boolean;
  needsGlutenFree: boolean;
  needsWheelchair: boolean;
}

function isValidSubmission(body: unknown): body is QuizSubmission {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!isValidVector(b.vector)) return false;
  if (!Array.isArray(b.answeredDims) || !b.answeredDims.every((d) => DIMS.includes(d))) return false;
  if (typeof b.radiusKm !== 'number' || !Number.isFinite(b.radiusKm)) return false;
  if (typeof b.worthTrip !== 'boolean') return false;
  if (b.primaryDrinkCategory !== null && !PRIMARY_DRINK_CATEGORIES.includes(b.primaryDrinkCategory as PrimaryDrinkCategory)) return false;
  if (typeof b.needsNonDairy !== 'boolean') return false;
  if (typeof b.needsGlutenFree !== 'boolean') return false;
  if (typeof b.needsWheelchair !== 'boolean') return false;
  return true;
}

// POST /api/quiz — saves a completed quiz to the authenticated user's
// taste_profiles row. Vector values are re-clamped server-side rather than
// trusted as-is from the client.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidSubmission(body)) {
    return NextResponse.json({ error: 'Malformed quiz submission.' }, { status: 400 });
  }

  const { vector, answeredDims, radiusKm, worthTrip, primaryDrinkCategory, needsNonDairy, needsGlutenFree, needsWheelchair } = body;
  const clamped = DIMS.reduce((acc, dim) => {
    acc[dim] = clampDim(vector[dim]);
    return acc;
  }, {} as Record<Dim, number>);

  const { error } = await supabase.from('taste_profiles').upsert(
    {
      user_id: user.id,
      ...clamped,
      answered_dims: answeredDims,
      radius_km: Math.max(0, Math.min(50, radiusKm)),
      worth_the_trip: worthTrip,
      primary_drink_category: primaryDrinkCategory,
      needs_non_dairy: needsNonDairy,
      needs_gluten_free: needsGlutenFree,
      needs_wheelchair: needsWheelchair,
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    await logServerError('api.quiz', error, { userId: user.id }, user.id);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('full_quiz_completed', user.id, { answeredDims, radiusKm, worthTrip, primaryDrinkCategory });

  return NextResponse.json({ success: true });
}
