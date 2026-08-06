import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';

// POST /api/account/delete — no body; the signed-in user deletes their own
// account, immediately (see privacy policy §6: no cron runner exists to
// honour a real 30-day grace window, so this is honest about being
// immediate rather than promising a delay it can't keep).
//
// Deleting the auth.users row cascades through every table that references
// public.users(id) on delete cascade (taste_profiles, saved_cafes, visits,
// cafe_feedback, rewards) — analytics_events/error_logs use on delete set
// null instead, so aggregate history survives, anonymised. Receipt images
// in Storage aren't part of that cascade, so they're removed explicitly
// first.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const admin = createAdminClient();

  const { data: files } = await admin.storage.from('receipts').list(user.id);
  if (files && files.length > 0) {
    await admin.storage.from('receipts').remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    await logServerError('api.account.delete', error, undefined, user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
