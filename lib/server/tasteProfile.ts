import type { SupabaseClient } from '@supabase/supabase-js';
import { DIMS, withDefaults, type Dim, type TasteVector } from '@/lib/matching';
import type { Database } from '@/lib/supabase/types';

// Reads/writes public.taste_profiles for the signed-in account area (Your
// Taste). Takes whatever client the caller already has — a session client
// in an authenticated route (RLS: auth.uid() = user_id) or the admin
// client for server-side jobs — rather than constructing its own, so RLS
// scoping stays the caller's decision.
export async function getTasteProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ vector: TasteVector; answeredDims: Dim[] } | null> {
  const { data, error } = await supabase
    .from('taste_profiles')
    .select('drink, energy, aesthetic, pace, adventure, price, food, answered_dims')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const vector = withDefaults(data as unknown as Partial<Record<Dim, unknown>>);
  const answeredDims = Array.isArray(data.answered_dims)
    ? data.answered_dims.filter((d): d is Dim => (DIMS as readonly string[]).includes(d))
    : [];
  return { vector, answeredDims };
}

// Upsert rather than update — a first save from someone who took the
// homepage quiz but never had a taste_profiles row yet should just work,
// not 404.
export async function upsertTasteProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  vector: TasteVector,
  answeredDims?: Dim[],
) {
  const row: Database['public']['Tables']['taste_profiles']['Insert'] = {
    user_id: userId,
    ...vector,
    updated_at: new Date().toISOString(),
  };
  if (answeredDims) row.answered_dims = answeredDims;

  return supabase.from('taste_profiles').upsert(row, { onConflict: 'user_id' }).select().maybeSingle();
}
