// Approximate centroids for the six launch clusters (§1.5) — good enough to
// seed a rough home point when someone picks a neighbourhood instead of
// sharing GPS. Not precise addresses; don't present these as anything more
// specific than "somewhere in this neighbourhood."
export const CALGARY_NEIGHBOURHOODS: { name: string; latitude: number; longitude: number }[] = [
  { name: 'Beltline', latitude: 51.038, longitude: -114.079 },
  { name: 'Mission / 17th Ave', latitude: 51.028, longitude: -114.073 },
  { name: 'Kensington', latitude: 51.052, longitude: -114.094 },
  { name: 'Inglewood', latitude: 51.045, longitude: -114.034 },
  { name: 'Bridgeland', latitude: 51.058, longitude: -114.04 },
  { name: 'Downtown / Stephen Ave', latitude: 51.045, longitude: -114.065 },
];
