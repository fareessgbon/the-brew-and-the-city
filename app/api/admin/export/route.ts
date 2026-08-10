import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';

// Quotes a field per RFC 4180 whenever it contains a comma, quote, or
// newline — the three characters that would otherwise break a naive
// join(','). Survey free-text answers routinely contain all three.
function csvField(value: unknown): string {
  // Answer blobs can hold objects now (a job application's resumeFile is
  // {path, name, size}) — String() on one produces the literal text
  // "[object Object]", so the whole cell would say nothing. Arrays get the
  // same treatment; a bare join would be ambiguous against free text that
  // already contains commas.
  const s =
    value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvField(row[h])).join(','));
  }
  return lines.join('\r\n');
}

// GET /api/admin/export?table=waitlist|cafe_partner|consumer|job_application
// — CSV download for the admin page (see chat, "similar to the launch site
// admin"). Survey answers are a jsonb blob, so each key gets flattened to
// its own column rather than shipping one opaque JSON cell.
//
// job_application rows live in survey_responses too (migration 0026), so
// they export through the same branch; only the filename differs.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const table = new URL(request.url).searchParams.get('table');
  const admin = createAdminClient();

  let filename: string;
  let csv: string;

  if (table === 'waitlist') {
    const { data } = await admin
      .from('waitlist')
      .select('email, name, go_to_cafes, created_at')
      .order('created_at', { ascending: false });
    filename = 'waitlist.csv';
    csv = toCsv(data ?? []);
  } else if (table === 'cafe_partner' || table === 'consumer' || table === 'job_application') {
    const { data } = await admin
      .from('survey_responses')
      .select('id, created_at, status, admin_notes, answers')
      .eq('survey', table)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    const flattened = (data ?? []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      admin_notes: row.admin_notes,
      ...(row.answers as Record<string, unknown>),
    }));
    filename = table === 'job_application' ? 'job-applications.csv' : `${table}-survey.csv`;
    csv = toCsv(flattened);
  } else {
    return NextResponse.json({ error: 'Unknown table.' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
