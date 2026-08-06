import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMatchesForUser, type CafeMatch } from '@/lib/server/getMatchesForUser';
import { isFeatureEnabled } from '@/lib/server/featureFlags';
import { CONTEXTS, type ContextKey } from '@/lib/matching';

function parseContext(raw: string | null): ContextKey | null {
  if (!raw) return null;
  return CONTEXTS.includes(raw as ContextKey) ? (raw as ContextKey) : null;
}

function serialize({ cafe, distanceMetres, match, openNow }: CafeMatch) {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    neighbourhood: cafe.neighbourhood,
    pct: match.totalScore,
    reason: match.reasons[0] ?? null,
    distanceMetres,
    openNow,
    openingHours: cafe.opening_hours,
  };
}

// GET /api/matches?context=study — real matches for the signed-in user's
// saved profile, via the shared getMatchesForUser() service (taste +
// context + real proximity + winter weighting + radius + "not it"
// exclusion, all in one place — not a second, drifted copy of the scoring
// logic). context is validated against the known ContextKey union before it
// ever reaches calculateMatch() — an unrecognized value is treated as "none"
// rather than passed through.
//
// worthTheTrip is a separate array, not merged into matches — those are
// exceptional cafés outside the stated radius, shown only because the
// profile opted into worth_the_trip, and the UI is expected to label them
// distinctly rather than mix them silently into the nearby list.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('taste_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: 'No taste profile yet — take the quiz first.' }, { status: 404 });
  }

  // §11 matching_feed — server-checked, not just hidden in the UI.
  if (!(await isFeatureEnabled('matching_feed'))) {
    return NextResponse.json({ matches: [], worthTheTrip: [], context: null, disabled: true });
  }

  const { searchParams } = new URL(request.url);
  const context = parseContext(searchParams.get('context'));

  const { inRadius, worthTheTrip } = await getMatchesForUser(user.id, context);

  return NextResponse.json({
    matches: inRadius.map(serialize),
    worthTheTrip: worthTheTrip.map(serialize),
    context,
  });
}
