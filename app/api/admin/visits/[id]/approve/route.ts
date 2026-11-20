import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { logServerError } from '@/lib/server/logError';
import { evaluateCityCard } from '@/lib/server/cityCard';

// POST /api/admin/visits/[id]/approve — the only way a pending receipt
// becomes a stamp (see migration 0020's comment on why /api/visits itself
// can't do this). Approving re-runs City Card eligibility immediately, so
// a member's 5th stamp mints their reward the moment it's reviewed rather
// than waiting on a separate job.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: visit, error: loadError } = await admin
    .from('visits')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    await logServerError('api.admin.visits.approve.load', loadError, { id });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
  if (!visit) return NextResponse.json({ error: 'That visit no longer exists.' }, { status: 404 });
  if (visit.status !== 'pending') {
    return NextResponse.json({ error: `Already ${visit.status} — nothing to do.` }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from('visits')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: 'admin' })
    .eq('id', id);

  if (updateError) {
    await logServerError('api.admin.visits.approve.update', updateError, { id });
    return NextResponse.json({ error: 'Couldn’t approve that visit. Try again.' }, { status: 500 });
  }

  const { awarded } = await evaluateCityCard(admin, visit.user_id);

  return NextResponse.json({ success: true, rewardAwarded: awarded });
}
