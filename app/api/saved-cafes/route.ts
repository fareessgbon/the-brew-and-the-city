import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';

// GET /api/saved-cafes — the signed-in user's saved cafés, joined with café details.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { data, error } = await supabase
    .from('saved_cafes')
    .select('id, created_at, cafes(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    await logServerError('api.saved-cafes.list', error, undefined, user.id);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ saved: data });
}

// POST /api/saved-cafes — body: { cafeId: string }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const cafeId = body?.cafeId;
  if (typeof cafeId !== 'string') {
    return NextResponse.json({ error: 'cafeId is required.' }, { status: 400 });
  }

  const { error } = await supabase.from('saved_cafes').insert({ user_id: user.id, cafe_id: cafeId });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true, alreadySaved: true });
    await logServerError('api.saved-cafes.create', error, { cafeId }, user.id);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('cafe_saved', user.id, { cafeId });

  return NextResponse.json({ success: true });
}
