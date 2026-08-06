export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radius = 6_371_000;
  const radians = (value: number) => (value * Math.PI) / 180;

  const latDifference = radians(lat2 - lat1);
  const lngDifference = radians(lng2 - lng1);

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(lngDifference / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Real café/user coordinates are often missing (step 10 is still mid-rollout
// — most cafés don't have lat/lng yet). Returns null rather than NaN so
// callers can fall back honestly instead of silently scoring against 0m.
export function distanceMetresOrNull(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) return null;
  return distanceMetres(lat1, lng1, lat2, lng2);
}
