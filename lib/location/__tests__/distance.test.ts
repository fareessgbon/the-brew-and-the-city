import { describe, expect, it } from 'vitest';
import { distanceMetres, distanceMetresOrNull } from '../distance';
import { isWithinRadius } from '@/lib/matching';

// Downtown Calgary and Kensington, roughly — real-ish coordinates so the
// "nearby" test has a sensible expected order of magnitude.
const DOWNTOWN = { lat: 51.0447, lng: -114.0719 };
const KENSINGTON = { lat: 51.052, lng: -114.094 };

describe('distanceMetres', () => {
  it('returns ~0 for identical coordinates', () => {
    const d = distanceMetres(DOWNTOWN.lat, DOWNTOWN.lng, DOWNTOWN.lat, DOWNTOWN.lng);
    expect(d).toBeCloseTo(0, 1);
  });

  it('returns a plausible distance for nearby coordinates', () => {
    const d = distanceMetres(DOWNTOWN.lat, DOWNTOWN.lng, KENSINGTON.lat, KENSINGTON.lng);
    // These two points are a few km apart in real Calgary — sanity-check the
    // order of magnitude rather than pinning an exact metre value.
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(5000);
  });

  it('is symmetric', () => {
    const a = distanceMetres(DOWNTOWN.lat, DOWNTOWN.lng, KENSINGTON.lat, KENSINGTON.lng);
    const b = distanceMetres(KENSINGTON.lat, KENSINGTON.lng, DOWNTOWN.lat, DOWNTOWN.lng);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('distanceMetresOrNull', () => {
  it('returns null when any coordinate is missing', () => {
    expect(distanceMetresOrNull(null, DOWNTOWN.lng, KENSINGTON.lat, KENSINGTON.lng)).toBeNull();
    expect(distanceMetresOrNull(DOWNTOWN.lat, undefined, KENSINGTON.lat, KENSINGTON.lng)).toBeNull();
    expect(distanceMetresOrNull(DOWNTOWN.lat, DOWNTOWN.lng, null, KENSINGTON.lng)).toBeNull();
    expect(distanceMetresOrNull(DOWNTOWN.lat, DOWNTOWN.lng, KENSINGTON.lat, undefined)).toBeNull();
  });

  it('returns a real number when all coordinates are present', () => {
    const d = distanceMetresOrNull(DOWNTOWN.lat, DOWNTOWN.lng, KENSINGTON.lat, KENSINGTON.lng);
    expect(d).not.toBeNull();
    expect(d).toBeGreaterThan(0);
  });
});

describe('radius filtering', () => {
  it('excludes a café outside the radius and includes one inside it', () => {
    const d = distanceMetres(DOWNTOWN.lat, DOWNTOWN.lng, KENSINGTON.lat, KENSINGTON.lng);
    expect(isWithinRadius(d, 1)).toBe(false); // under 1km radius — too far
    expect(isWithinRadius(d, 10)).toBe(true); // under 10km radius — fine
  });
});
