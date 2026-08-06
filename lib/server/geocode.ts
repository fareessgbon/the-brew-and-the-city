// Looks up latitude/longitude for a street address via OpenStreetMap's
// Nominatim — free, no API key, appropriate for this app's actual volume
// (an admin saving one café at a time, or an occasional CSV batch). Revisit
// with a paid geocoder (e.g. Mapbox — NEXT_PUBLIC_MAPBOX_TOKEN is already an
// env var away) if café volume grows past occasional admin use; Nominatim's
// usage policy caps this at roughly 1 request/second and asks for a
// descriptive User-Agent, both honored here.
//
// Never throws. A failed, ambiguous, or unrecognized address just means no
// coordinates get set — the same state leaving them blank always produced —
// it must never block saving the café itself over a geocoding hiccup.
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');

    const response = await fetch(url, {
      headers: { 'User-Agent': 'BrewAndTheCity-AdminGeocoding/1.0 (hello@brewandthecity.com)' },
    });
    if (!response.ok) return null;

    const results = (await response.json()) as unknown;
    if (!Array.isArray(results) || results.length === 0) return null;

    const first = results[0] as { lat?: unknown; lon?: unknown };
    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}

// Respects Nominatim's ~1 request/second usage policy across a batch of
// lookups (e.g. a CSV import) run sequentially in a loop — call this
// between iterations, not before the first one.
export function geocodeThrottleMs(): number {
  return 1100;
}
