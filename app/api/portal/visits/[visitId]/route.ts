import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPortalSession } from '@/lib/portalSession';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { isFeatureEnabled } from '@/lib/server/featureFlags';

// POST /api/portal/visits/[visitId] — body: { action: 'approve' | 'reject' }.
// Gated by the portal-session cookie for the café that actually owns this
// visit — a valid session for café A can't touch café B's queue, even
// though both go through the same service-role client underneath.
export async function POST(request: Request, { params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject".' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: visit } = await admin.from('visits').select('*').eq('id', visitId).maybeSingle();
  if (!visit) return NextResponse.json({ error: 'Visit not found.' }, { status: 404 });

  const authorized = await hasPortalSession(visit.cafe_id);
  if (!authorized) return NextResponse.json({ error: 'Not signed in to this café’s portal.' }, { status: 401 });

  // §11 cafe_review_queue — server-checked, not just hidden in the UI.
  if (!(await isFeatureEnabled('cafe_review_queue'))) {
    return NextResponse.json({ error: 'Receipt review is temporarily paused.' }, { status: 503 });
  }

  if (visit.status !== 'pending') {
    return NextResponse.json({ error: `Already ${visit.status}.` }, { status: 409 });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  const { error } = await admin
    .from('visits')
    .update({ status, stamp_awarded: action === 'approve', reviewed_at: new Date().toISOString(), reviewed_by: 'cafe' })
    .eq('id', visitId);

  if (error) {
    await logServerError('api.portal.visits.review', error, { visitId, action });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await trackServerEvent(action === 'approve' ? 'receipt_approved' : 'receipt_rejected', visit.user_id, { visitId, cafeId: visit.cafe_id });

  return NextResponse.json({ success: true, status });
}
