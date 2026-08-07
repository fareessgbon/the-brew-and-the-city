import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';

// POST /api/feedback/not-it — body: { cafeId: string }
// Not one of the original 8 tables; added cafe_feedback (migration 0003) so
// this writes somewhere real instead of returning a fake success. Now fed
// back into matching via getMatchesForUser's not-it exclusion (step 5/8),
// and tracked as not_it_submitted (step 9).
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

  const { error } = await supabase
    .from('cafe_feedback')
    .upsert({ user_id: user.id, cafe_id: cafeId, feedback: 'not_it' }, { onConflict: 'user_id,cafe_id,feedback' });

  if (error) {
    await logServerError('api.feedback.not-it', error, { cafeId }, user.id);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('not_it_submitted', user.id, { cafeId });

  return NextResponse.json({ success: true });
}

// DELETE /api/feedback/not-it — body: { cafeId: string }. Undoes a "Not it"
// — RLS (migration 0003) already scopes this to the caller's own rows, so
// there's nothing here that lets one user touch another's feedback.
export async function DELETE(request: Request) {
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

  const { error } = await supabase.from('cafe_feedback').delete().eq('user_id', user.id).eq('cafe_id', cafeId).eq('feedback', 'not_it');

  if (error) {
    await logServerError('api.feedback.not-it.undo', error, { cafeId }, user.id);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('not_it_undone', user.id, { cafeId });

  return NextResponse.json({ success: true });
}
