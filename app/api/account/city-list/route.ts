import { NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';

// POST/DELETE /api/account/city-list — save/unsave a café. Session client:
// RLS's "users can manage their own saved cafes" policy scopes every read
// and write to auth.uid(), so there's nothing here to spoof by passing a
// different user's id.
async function getUserOr401() {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  return { session, user };
}

function parseCafeId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const cafeId = (body as Record<string, unknown>).cafeId;
  return typeof cafeId === 'string' && cafeId.length > 0 ? cafeId : null;
}

export async function POST(request: Request) {
  const { session, user } = await getUserOr401();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const cafeId = parseCafeId(await request.json().catch(() => null));
  if (!cafeId) return NextResponse.json({ error: 'A café id is required.' }, { status: 400 });

  // unique(user_id, cafe_id) makes a repeat save a no-op rather than an
  // error — the button toggles state, it shouldn't matter how many times
  // a double-click fires it.
  const { error } = await session.from('saved_cafes').upsert({ user_id: user.id, cafe_id: cafeId }, { onConflict: 'user_id,cafe_id' });
  if (error) {
    await logServerError('api.account.city-list.save', error, { cafeId }, user.id);
    return NextResponse.json({ error: 'Couldn’t save that café. Try again.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { session, user } = await getUserOr401();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const cafeId = parseCafeId(await request.json().catch(() => null));
  if (!cafeId) return NextResponse.json({ error: 'A café id is required.' }, { status: 400 });

  const { error } = await session.from('saved_cafes').delete().eq('user_id', user.id).eq('cafe_id', cafeId);
  if (error) {
    await logServerError('api.account.city-list.remove', error, { cafeId }, user.id);
    return NextResponse.json({ error: 'Couldn’t remove that café. Try again.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
