import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { trackServerEvent } from '@/lib/server/trackEvent';

const NEIGHBOURHOODS = [
  'Beltline',
  'Mission / 17th Ave',
  'Kensington',
  'Inglewood',
  'Bridgeland',
  'Downtown / Stephen Ave',
  'Other Calgary neighbourhood',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_RE = /^@?[a-zA-Z0-9._]{1,30}$/;
const MAX_APPLICATIONS_PER_HOUR = 3;

interface Body {
  cafeName?: unknown;
  email?: unknown;
  neighbourhood?: unknown;
  instagram?: unknown;
}

function validate(body: Body): string | null {
  const cafeName = typeof body.cafeName === 'string' ? body.cafeName.trim() : '';
  if (!cafeName || cafeName.length > 120) return 'Café name is required (and under 120 characters).';

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!EMAIL_RE.test(email)) return 'A valid contact email is required.';

  const neighbourhood = typeof body.neighbourhood === 'string' ? body.neighbourhood.trim() : '';
  if (!NEIGHBOURHOODS.includes(neighbourhood)) return 'Please choose a listed neighbourhood.';

  if (body.instagram != null && body.instagram !== '') {
    if (typeof body.instagram !== 'string' || !INSTAGRAM_RE.test(body.instagram.trim())) {
      return 'Instagram handle looks off — 30 characters max, letters/numbers/periods/underscores only.';
    }
  }

  return null;
}

// POST /api/partner-applications — the only place that writes to
// partner_applications now; CafeApplicationForm just posts the form here.
// Uses the admin client because rate-limiting requires reading *other*
// applicants' recent submissions (by IP), which the public RLS insert
// policy on this table was never scoped to allow.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const cafeName = (body.cafeName as string).trim();
  const email = (body.email as string).trim().toLowerCase();
  const neighbourhood = (body.neighbourhood as string).trim();
  const instagram = typeof body.instagram === 'string' && body.instagram.trim() ? body.instagram.trim() : null;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const supabase = createAdminClient();

  // Request frequency: cap how many applications a given email can submit
  // per hour, independent of the duplicate-pending-application check below.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from('partner_applications')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', oneHourAgo);

  if ((recentCount ?? 0) >= MAX_APPLICATIONS_PER_HOUR) {
    return NextResponse.json({ error: 'Too many applications from this email recently — please try again later.' }, { status: 429 });
  }

  const { error } = await supabase.from('partner_applications').insert({
    cafe_name: cafeName,
    email,
    neighbourhood,
    instagram,
  });

  if (error) {
    // Unique index blocks a second *pending* application from the same email.
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `We already have a pending application for ${email} — we'll be in touch soon.` },
        { status: 409 },
      );
    }
    await logServerError('api.partner-applications', error, { ip, cafeName, neighbourhood });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  await trackServerEvent('partner_application_submitted', null, { cafeName, neighbourhood });

  return NextResponse.json({ success: true, cafeName, neighbourhood, email });
}
