import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { logServerError } from '@/lib/server/logError';
import type { SurveyStatus } from '@/lib/supabase/types';

const VALID_STATUSES: SurveyStatus[] = ['new', 'contacted', 'selected', 'declined'];

// PATCH /api/admin/survey-responses/[id] — body: { status?, adminNotes? }.
// The review workflow's write path (migration 0023) — moving a café
// survey response through new -> contacted -> selected/declined, or
// leaving a note, without ever exposing this table to anything but the
// PIN-gated admin session.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const update: { status?: SurveyStatus; admin_notes?: string | null } = {};
  if ('status' in body) {
    if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status as SurveyStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    update.status = body.status as SurveyStatus;
  }
  if ('adminNotes' in body) {
    update.admin_notes = typeof body.adminNotes === 'string' ? body.adminNotes : null;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('survey_responses').update(update).eq('id', id);

  if (error) {
    await logServerError('api.admin.survey-responses.patch', error, { id });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
