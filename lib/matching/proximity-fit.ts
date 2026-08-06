import {
  PROXIMITY_PLATEAU_KM,
  PROXIMITY_TAU_SUMMER_KM,
  PROXIMITY_WINTER_MULTIPLIER,
  WINTER_MONTHS,
} from './constants';

// §1.5 — shrinks the decay tau Nov–Mar so distance is weighted more heavily
// once Calgary winter makes "a great café 15 minutes away" a harder sell.
export function seasonDistanceMultiplier(month: number): number {
  return WINTER_MONTHS.includes(month) ? PROXIMITY_WINTER_MULTIPLIER : 1.0;
}

// §7.4a — plateau to 1km (close enough that taste decides, not metres),
// exponential decay after. The decay rate itself shrinks in winter.
export function proximityFit(distanceKm: number, month: number): number {
  if (distanceKm <= PROXIMITY_PLATEAU_KM) return 100;
  const tau = PROXIMITY_TAU_SUMMER_KM * seasonDistanceMultiplier(month);
  return 100 * Math.exp(-(distanceKm - PROXIMITY_PLATEAU_KM) / tau);
}
