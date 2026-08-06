import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPortalSession } from '@/lib/portalSession';
import { logServerError } from '@/lib/server/logError';

// PATCH /api/portal/reward-items/[itemId] — body: { isAvailable?: boolean }.
// Only the availability toggle for now — a café marking an item temporarily
// unavailable (§3.0.5) is the one edit that needs to happen fast, mid-shift.
// Bigger edits (price, description) go through delete + re-add.
export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.isAvailable !== 'boolean') {
    return NextResponse.json({ error: 'isAvailable must be true or false.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: item } = await admin.from('reward_items').select('cafe_id').eq('id', itemId).maybeSingle();
  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });

  const authorized = await hasPortalSession(item.cafe_id);
  if (!authorized) return NextResponse.json({ error: 'Not signed in to this café’s portal.' }, { status: 401 });

  const { error } = await admin
    .from('reward_items')
    .update({ is_available: body.isAvailable, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) {
    await logServerError('api.portal.reward-items.update', error, { itemId });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/portal/reward-items/[itemId]
export async function DELETE(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const admin = createAdminClient();
  const { data: item } = await admin.from('reward_items').select('cafe_id').eq('id', itemId).maybeSingle();
  if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });

  const authorized = await hasPortalSession(item.cafe_id);
  if (!authorized) return NextResponse.json({ error: 'Not signed in to this café’s portal.' }, { status: 401 });

  const { error } = await admin.from('reward_items').delete().eq('id', itemId);
  if (error) {
    await logServerError('api.portal.reward-items.delete', error, { itemId });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
