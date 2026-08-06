import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hashReceipt } from '@/lib/receiptHash';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { isFeatureEnabled } from '@/lib/server/featureFlags';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

// POST /api/visits — multipart form: { receipt: File, cafeId: string }.
// Creates a pending visit for café-portal (or admin) review. Two duplicate
// checks before anything is stored: the exact same photo can't be reused
// (receipt_hash), and a member can't submit more than one receipt for the
// same café on the same day (a cruder but real guard against spamming).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  // §11 receipt_uploads — server-checked, not just hidden in the UI.
  if (!(await isFeatureEnabled('receipt_uploads'))) {
    return NextResponse.json({ error: 'Receipt uploads are temporarily paused.' }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('receipt');
  const cafeId = formData?.get('cafeId');

  if (!(file instanceof File) || typeof cafeId !== 'string' || !cafeId) {
    return NextResponse.json({ error: 'A receipt photo and café are required.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type — use JPEG, PNG, WebP, or HEIC.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File is too large (8 MB max).' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: cafe } = await admin.from('cafes').select('id, partner_status').eq('id', cafeId).maybeSingle();
  if (!cafe) return NextResponse.json({ error: 'Café not found.' }, { status: 404 });
  if (cafe.partner_status === 'listed') {
    return NextResponse.json({ error: 'This café isn’t part of the City Card network.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const receiptHash = hashReceipt(bytes);

  const { data: duplicateReceipt } = await admin.from('visits').select('id').eq('receipt_hash', receiptHash).maybeSingle();
  if (duplicateReceipt) {
    return NextResponse.json({ error: 'This receipt has already been submitted.' }, { status: 409 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await admin
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('cafe_id', cafeId)
    .gte('created_at', startOfDay.toISOString());
  if ((todayCount ?? 0) > 0) {
    return NextResponse.json({ error: 'You’ve already submitted a receipt for this café today.' }, { status: 429 });
  }

  const path = `${user.id}/${randomUUID()}-${file.name}`;
  const { error: uploadError } = await admin.storage.from('receipts').upload(path, bytes, { contentType: file.type });
  if (uploadError) {
    await logServerError('api.visits.upload', uploadError, { userId: user.id, cafeId }, user.id);
    return NextResponse.json({ error: 'Could not upload the receipt. Please try again.' }, { status: 500 });
  }

  const { data: visit, error: insertError } = await admin
    .from('visits')
    .insert({
      user_id: user.id,
      cafe_id: cafeId,
      receipt_image_path: path,
      receipt_hash: receiptHash,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    await admin.storage.from('receipts').remove([path]);
    await logServerError('api.visits.create', insertError, { userId: user.id, cafeId }, user.id);
    return NextResponse.json({ error: 'Could not save the visit. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('receipt_submitted', user.id, { cafeId });

  return NextResponse.json({ success: true, visitId: visit.id });
}

// GET /api/visits — the signed-in user's own visit history.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { data, error } = await supabase
    .from('visits')
    .select('id, cafe_id, status, visited_at, created_at, cafes(name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    await logServerError('api.visits.list', error, undefined, user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visits: data });
}
