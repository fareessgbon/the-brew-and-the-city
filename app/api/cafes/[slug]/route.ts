import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import type { CafeApiShape } from '../route';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('cafes').select('*').eq('slug', slug).maybeSingle();

  if (error) {
    await logServerError('api.cafes.detail', error, { slug });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Café not found' }, { status: 404 });
  }

  const cafe: CafeApiShape = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    neighbourhood: data.neighbourhood,
    partnerStatus: data.partner_status,
    isPartner: data.partner_status !== 'listed',
    latitude: data.latitude,
    longitude: data.longitude,
    vector: {
      drink: data.drink_score,
      energy: data.energy_score,
      aesthetic: data.aesthetic_score,
      pace: data.pace_score,
      adventure: data.adventure_score,
      price: data.price_score,
      food: data.food_score,
    },
  };

  return NextResponse.json({ cafe });
}
