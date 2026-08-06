import { redirect } from 'next/navigation';
import type { createClient } from '@/lib/supabase/server';

// Every page that assumes a finished taste profile calls this right after
// its own `if (!user) redirect('/login?next=...')` check — an
// authenticated-but-not-onboarded visitor is sent back into the flow
// instead of seeing a degraded "no taste profile yet" state.
export async function assertOnboarded(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('taste_profiles').select('onboarding_completed').eq('user_id', userId).maybeSingle();
  if (!data?.onboarding_completed) redirect('/onboarding');
}
