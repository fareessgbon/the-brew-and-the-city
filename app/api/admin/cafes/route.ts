import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { logServerError } from '@/lib/server/logError';
import { parseCafePayload, isDuplicateSlug } from '@/lib/server/cafePayload';

// POST /api/admin/cafes — create one café from the editor at
// /admin/cafes/new. The write path for the only table in this build whose
// rows are typed in by a person rather than submitted by a visitor.
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { data, error: invalid } = parseCafePayload(body, { partial: false });
  if (invalid || !data) {
    return NextResponse.json({ error: invalid ?? 'Invalid request.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.from('cafes').insert(data).select('id').single();

  if (error) {
    if (isDuplicateSlug(error)) {
      return NextResponse.json({ error: `A café already uses the slug “${data.slug}”.` }, { status: 409 });
    }
    await logServerError('api.admin.cafes.post', error, { slug: data.slug });
    return NextResponse.json({ error: 'Something went wrong saving that café.' }, { status: 500 });
  }

  return NextResponse.json({ id: created.id });
}
