import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';

// DELETE /api/saved-cafes/[cafeId] — deletes by café id, not the saved_cafes
// row's own id. A save/unsave toggle on a café card only ever knows the
// café's id when rendering, not the join row's id, so keying on cafeId here
// avoids an extra round-trip to look it up first.
export async function DELETE(_request: Request, { params }: { params: Promise<{ cafeId: string }> }) {
  const { cafeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { error } = await supabase.from('saved_cafes').delete().eq('user_id', user.id).eq('cafe_id', cafeId);
  if (error) {
    await logServerError('api.saved-cafes.delete', error, { cafeId }, user.id);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
