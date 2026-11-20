import { NextResponse } from 'next/server';
import { createSessionClient } from '@/lib/supabase/server';

// Where the magic link in LoginForm's emailRedirectTo actually lands.
// Supabase appends its own `code` param; exchanging it here (server-side,
// via createSessionClient so the resulting session cookie is set on this
// response) is what turns "clicked an email link" into "signed in" for the
// proxy.ts check on the next request to /discover.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/discover';

  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}
