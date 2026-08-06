import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

// Call at the top of every admin Server Component / Server Action. Redirects
// unauthenticated visitors to /login, and bounces authenticated-but-not-admin
// visitors to the homepage (rather than a page that discloses the admin
// dashboard exists behind a "you're not allowed" wall).
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/admin');
  if (!isAdminEmail(user.email)) redirect('/');

  return user;
}
