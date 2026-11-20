import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { logServerError } from '@/lib/server/logError';

// POST /api/admin/visits/[id]/reject — a receipt that didn't qualify.
// Unlike the job-application reject route, there's no email here (a
// member finds out by checking the app, same as the mockup's "pending"
// state) — this just closes the row out so it drops off the queue.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: visit, error: loadError } = await admin.from('visits').select('id, status').eq('id', id).maybeSingle();

  if (loadError) {
    await logServerError('api.admin.visits.reject.load', loadError, { id });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
  if (!visit) return NextResponse.json({ error: 'That visit no longer exists.' }, { status: 404 });
  if (visit.status !== 'pending') {
    return NextResponse.json({ error: `Already ${visit.status} — nothing to do.` }, { status: 409 });
  }

  const { error: updateError } = await admin
    .from('visits')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: 'admin' })
    .eq('id', id);

  if (updateError) {
    await logServerError('api.admin.visits.reject.update', updateError, { id });
    return NextResponse.json({ error: 'Couldn’t reject that visit. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
