import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { logServerError } from '@/lib/server/logError';
import { parseCafePayload, isDuplicateSlug } from '@/lib/server/cafePayload';

// PATCH /api/admin/cafes/[id] — save edits from /admin/cafes/[id]. Sends
// only the fields the editor holds, so a column this build doesn't know
// about (contract dates, portal PIN) is never overwritten by a save here.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { data, error: invalid } = parseCafePayload(body, { partial: true });
  if (invalid || !data) {
    return NextResponse.json({ error: invalid ?? 'Invalid request.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('cafes')
    // updated_at has a default but no trigger behind it (migration 0001),
    // so an edit that didn't set it would leave the row claiming it was
    // last touched when it was first inserted.
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (isDuplicateSlug(error)) {
      return NextResponse.json({ error: `A café already uses the slug “${data.slug}”.` }, { status: 409 });
    }
    await logServerError('api.admin.cafes.patch', error, { id });
    return NextResponse.json({ error: 'Something went wrong saving that café.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/cafes/[id] — archive, not remove. Same reasoning as
// the survey soft delete (migration 0024): visits, saved_cafes and taste
// profiles all reference cafes.id, and a hard delete would cascade real
// user history off the back of one mis-click. is_active = false takes the
// café out of the homepage query and off the working list; the row and
// anything pointing at it survive.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from('cafes')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    await logServerError('api.admin.cafes.delete', error, { id });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
