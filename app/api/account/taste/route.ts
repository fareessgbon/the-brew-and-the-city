import { NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { upsertTasteProfile } from '@/lib/server/tasteProfile';
import { DIMS, clampDim, type Dim } from '@/lib/matching';

// PUT /api/account/taste — Your Taste's slider save. Session client, not
// admin: RLS's "users can manage their own taste profile" policy already
// scopes this to auth.uid(), so there's no user_id in the request body to
// trust or mistrust.
export async function PUT(request: Request) {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const vector = {} as Record<Dim, number>;
  for (const d of DIMS) {
    const v = record[d];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      return NextResponse.json({ error: `Missing or invalid value for "${d}".` }, { status: 400 });
    }
    vector[d] = clampDim(v);
  }

  const { error } = await upsertTasteProfile(session, user.id, vector);
  if (error) {
    await logServerError('api.account.taste', error, {}, user.id);
    return NextResponse.json({ error: 'Something went wrong saving that.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, vector });
}
