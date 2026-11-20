import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient, createSessionClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimitPersistent, clientIp } from '@/lib/server/rateLimit';
import { ALLOWED_RECEIPT_TYPES, RECEIPT_BUCKET, receiptExtension, validateReceipt } from '@/lib/visits/receipt';

const MAX_SUBMISSIONS_PER_DAY = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

// POST /api/visits — a City Card receipt upload. Requires a real session
// (getUser(), not just a bearer key) but writes with the admin client:
// migration 0020 dropped the direct "users can insert their own visits"
// policy after finding a signed-in member could otherwise mint an
// 'approved'/stamp_awarded row with nothing but the anon key — this route
// is now the only legal write path into `visits`, and it only ever writes
// status: 'pending'. Approval happens in /admin/visits.
export async function POST(request: Request) {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });

  const cafeId = form.get('cafeId');
  if (typeof cafeId !== 'string' || !cafeId) {
    return NextResponse.json({ error: 'Choose which café this receipt is from.' }, { status: 400 });
  }

  const receipt = form.get('receipt');
  const receiptFile = receipt instanceof File && receipt.size > 0 ? receipt : null;
  if (!receiptFile) {
    return NextResponse.json({ error: 'Attach a photo of your receipt.' }, { status: 400 });
  }
  const problem = validateReceipt(receiptFile);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const admin = createAdminClient();

  const tooMany = !(
    await checkRateLimitPersistent(admin, `visits:${user.id}:${clientIp(request)}`, MAX_SUBMISSIONS_PER_DAY, WINDOW_MS)
  ).allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many receipts uploaded today — try again tomorrow.' }, { status: 429 });
  }

  // Confirm the café is real and live, not just any uuid-shaped string —
  // an admin reviewing the queue needs a name to show, not a dangling id.
  const { data: cafe } = await admin.from('cafes').select('id').eq('id', cafeId).eq('is_active', true).maybeSingle();
  if (!cafe) {
    return NextResponse.json({ error: 'That café isn’t in the network.' }, { status: 400 });
  }

  const buffer = Buffer.from(await receiptFile.arrayBuffer());
  const receiptHash = createHash('sha256').update(buffer).digest('hex');

  // §20 / migration 0008 — the exact same receipt photo can't be used
  // twice, unique index on receipt_hash. Checked here first so the
  // response can say why, rather than surfacing a raw constraint error.
  const { data: duplicate } = await admin.from('visits').select('id').eq('receipt_hash', receiptHash).maybeSingle();
  if (duplicate) {
    return NextResponse.json({ error: 'That receipt has already been used for a visit.' }, { status: 409 });
  }

  const ext = receiptExtension(receiptFile.name) ?? 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from(RECEIPT_BUCKET)
    .upload(path, buffer, { contentType: ALLOWED_RECEIPT_TYPES[ext] ?? receiptFile.type, upsert: false });

  if (uploadError) {
    await logServerError('api.visits.upload', uploadError, { cafeId }, user.id);
    return NextResponse.json({ error: 'We couldn’t save that photo. Try again.' }, { status: 500 });
  }

  const { error: insertError } = await admin.from('visits').insert({
    user_id: user.id,
    cafe_id: cafeId,
    receipt_image_path: path,
    receipt_hash: receiptHash,
    status: 'pending',
  });

  if (insertError) {
    await logServerError('api.visits.insert', insertError, { cafeId }, user.id);
    // No row means nothing references the upload — clean it up rather than
    // leaving someone's receipt photo orphaned in storage.
    const { error: removeError } = await admin.storage.from(RECEIPT_BUCKET).remove([path]);
    if (removeError) await logServerError('api.visits.orphan-cleanup', removeError, { path });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
