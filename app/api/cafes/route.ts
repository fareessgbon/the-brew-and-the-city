import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import type { Database } from '@/lib/supabase/types';

type CafeRow = Database['public']['Tables']['cafes']['Row'];

export interface CafeApiShape {
  id: string;
  name: string;
  slug: string;
  neighbourhood: string | null;
  partnerStatus: CafeRow['partner_status'];
  isPartner: boolean;
  latitude: number | null;
  longitude: number | null;
  vector: {
    drink: number;
    energy: number;
    aesthetic: number;
    pace: number;
    adventure: number;
    price: number;
    food: number;
  };
}

function toApiShape(row: CafeRow): CafeApiShape {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    neighbourhood: row.neighbourhood,
    partnerStatus: row.partner_status,
    isPartner: row.partner_status !== 'listed',
    latitude: row.latitude,
    longitude: row.longitude,
    vector: {
      drink: row.drink_score,
      energy: row.energy_score,
      aesthetic: row.aesthetic_score,
      pace: row.pace_score,
      adventure: row.adventure_score,
      price: row.price_score,
      food: row.food_score,
    },
  };
}

// GET /api/cafes — public catalogue read. RLS already allows anonymous
// select on `cafes`, so this uses the regular (anon-key) client, not admin.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cafes').select('*').order('name');

  if (error) {
    await logServerError('api.cafes.list', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ cafes: data.map(toApiShape) });
}
