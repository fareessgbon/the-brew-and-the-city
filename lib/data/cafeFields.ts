// The shape of a café record as the admin editor writes it — one place the
// form, the API route and the list page all agree on, so a field can't be
// validated one way and rendered another.
//
// This is deliberately a subset of the `cafes` table. That table carries a
// lot of columns the full product owns (portal_pin, contract dates,
// monthly_redemption_cap, the founding-partner lifecycle...) and none of
// them are things you'd sit down and type in while entering a café you just
// visited. What's here is what a person with a notebook actually knows.

import { DIMS, LABELS, PRIMARY_DRINK_CATEGORIES, PRIMARY_DRINK_CATEGORY_LABELS, type Dim } from '@/lib/matching/constants';

export { DIMS, LABELS, PRIMARY_DRINK_CATEGORIES, PRIMARY_DRINK_CATEGORY_LABELS };
export type { Dim };

// CafeEditorValues/EMPTY_CAFE live here rather than in CafeEditorForm.tsx
// (where the form itself lives) because that file is 'use client' — any
// Server Component that imports a value (not just a type) from a client
// module gets an opaque client reference back, not the real object.
// Spreading that reference (`{...EMPTY_CAFE, name: '...'}`, as the
// survey-prefill code on /admin/cafes/new does) silently produces an
// object with only the explicitly-listed keys and `undefined` for
// everything else — passing EMPTY_CAFE straight through as a prop happens
// to still work, which is what made this look fine until prefill shipped.
// Plain data has no business living in a client-only file regardless.
export interface CafeEditorValues {
  id?: string;
  name: string;
  slug: string;
  city: City;
  neighbourhood: string;
  address: string;
  latitude: string;
  longitude: string;
  website_url: string;
  instagram_handle: string;
  contact_email: string;
  contact_phone: string;
  price_band: string;
  drink_categories: string[];
  opening_hours: OpeningHours;
  partner_status: string;
  verified: boolean;
  scores: Record<Dim, number>;
}

// A brand-new café starts at 50 on every dim — the neutral vector matching
// already falls back to (lib/matching/vectors.ts). It is not a guess about
// the café; it's the absence of one, which is the honest starting point
// before anyone has been.
export const EMPTY_CAFE: CafeEditorValues = {
  name: '',
  slug: '',
  city: 'calgary',
  neighbourhood: '',
  address: '',
  latitude: '',
  longitude: '',
  website_url: '',
  instagram_handle: '',
  contact_email: '',
  contact_phone: '',
  price_band: '',
  drink_categories: [...PRIMARY_DRINK_CATEGORIES],
  opening_hours: {},
  partner_status: 'listed',
  verified: false,
  scores: DIMS.reduce((acc, d) => ({ ...acc, [d]: 50 }), {} as Record<Dim, number>),
};

// Matches the `cafes.city` check constraint (migration 0030) — a fixed
// enum, not free text, since this drives which neighbourhood suggestions
// show and (eventually) which cafés a given visitor's results are scoped
// to, not just what gets printed on a card.
export const CITIES = ['calgary', 'toronto'] as const;
export type City = (typeof CITIES)[number];

export const CITY_LABELS: Record<City, string> = {
  calgary: 'Calgary',
  toronto: 'Toronto',
};

export const PARTNER_STATUSES = ['listed', 'partner', 'featured', 'founding_partner'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  listed: 'Listed',
  partner: 'Partner',
  featured: 'Featured',
  founding_partner: 'Founding partner',
};

export const PRICE_BANDS = ['$', '$$', '$$$'] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

// Stored exactly as migration 0001 documents it: { "mon": ["07:00","18:00"] }.
// A day that's missing from the object means closed — there's no "closed"
// sentinel to get wrong.
export type OpeningHours = Partial<Record<Day, [string, string]>>;

// What the sliders are actually asking, in the same words the quiz uses on
// the other side of the match. The dim only means something as a position
// between these two poles, so the form shows both ends, never a bare number.
export const DIM_QUESTIONS: Record<Dim, string> = {
  drink: 'How do their drinks read?',
  energy: 'How does the room feel?',
  aesthetic: 'How is it decorated?',
  pace: 'What do people do here?',
  adventure: 'How does the menu move?',
  price: 'What does a drink cost?',
  food: 'How serious is the food?',
};

// Neighbourhoods that already appear in the seeded data, per city, offered
// as a datalist rather than a fixed <select> — typing a new one has to stay
// possible, since the list of neighbourhoods with cafés in them is not
// something this file gets to decide.
export const NEIGHBOURHOOD_SUGGESTIONS_BY_CITY: Record<City, string[]> = {
  calgary: [
    'Beltline',
    'Bridgeland',
    'Downtown',
    'Eau Claire',
    'Hillhurst',
    'Inglewood',
    'Kensington',
    'Marda Loop',
    'Mission',
    'Ramsay',
    'Sunalta',
    'Victoria Park',
  ],
  toronto: [
    'Church-Wellesley',
    'Kensington Market',
    'Little Italy',
    'Ossington',
    'Riverside',
  ],
};

// Matches the unique constraint on cafes.slug: lowercase, ASCII, no runs of
// separators. Generated from the name as you type, but always overridable —
// once a café is saved the slug is its identity and renaming it shouldn't
// silently move it.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CafeRecord {
  name: string;
  slug: string;
  city: City;
  neighbourhood: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  instagram_handle: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  price_band: PriceBand | null;
  drink_categories: string[];
  opening_hours: OpeningHours | null;
  partner_status: PartnerStatus;
  is_active: boolean;
  verified_at: string | null;
  drink_score: number;
  energy_score: number;
  aesthetic_score: number;
  pace_score: number;
  adventure_score: number;
  price_score: number;
  food_score: number;
}

// Every column the editor reads back, in one string. Written as a single
// literal (not a concatenation) because postgrest-js infers the row type
// from the literal type of this argument — built from pieces at runtime, it
// widens to `string` and every field on the result types as an error.
export const CAFE_COLUMNS =
  'id, name, slug, city, neighbourhood, address, latitude, longitude, website_url, instagram_handle, contact_email, contact_phone, price_band, drink_categories, opening_hours, partner_status, is_active, verified_at, drink_score, energy_score, aesthetic_score, pace_score, adventure_score, price_score, food_score, created_at, updated_at' as const;

// A café is only as useful as the fields matching actually reads. This
// covers only the *structural* gaps — where it is, what neighbourhood to
// print — because "not verified" and "not scored" already get their own
// signal (the verified chip, isUnscored below) elsewhere on the same card.
// Saying the same thing two different ways in two different places on one
// card is exactly the kind of redundancy that makes a list harder to scan,
// not easier.
export function missingEssentials(cafe: {
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
}): string[] {
  const missing: string[] = [];
  if (!cafe.neighbourhood) missing.push('neighbourhood');
  if (cafe.latitude == null || cafe.longitude == null) missing.push('coordinates');
  return missing;
}

// True until at least one slider has been moved off its starting point.
// Distinct from "missing essentials" — a café can have a name, address,
// coordinates and a verified visit, and still have nobody's actual taste
// judgment recorded, which is silent in a way an empty text field isn't.
export function isUnscored(scores: Record<Dim, number>): boolean {
  return DIMS.every((d) => scores[d] === 50);
}

// Picks the dims where this café reads furthest from neutral and states
// them in the same pole words the quiz shows a visitor (LABELS) — so a
// preview built from this is never off-vocabulary from the real site.
// Empty once nothing clears the threshold, i.e. effectively unscored.
export function describeVector(scores: Record<Dim, number>, max = 2, threshold = 15): string[] {
  return [...DIMS]
    .map((d) => ({ d, delta: Math.abs(scores[d] - 50) }))
    .filter((x) => x.delta >= threshold)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, max)
    .map(({ d }) => LABELS[d][scores[d] >= 50 ? 'high' : 'low']);
}

// A rough "how much work is this row" score for sorting the list —
// structural gaps count double an unverified or unscored café, since a
// café with no neighbourhood or coordinates can't be shown or matched at
// all, where the other two are honest-but-incomplete rather than broken.
export function workRemaining(cafe: {
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
  verified_at: string | null;
  scores: Record<Dim, number>;
}): number {
  return (
    missingEssentials(cafe).length * 2 +
    (cafe.verified_at ? 0 : 1) +
    (isUnscored(cafe.scores) ? 1 : 0)
  );
}

// One free-text field on the café-partner survey (§ CafePartnerSurveyForm)
// covers both "Instagram" and "website" — splitting it here, once, so both
// the admin card link and the prefilled form agree on which bucket a given
// answer lands in, instead of guessing twice.
function splitInstagramOrWebsite(value: string): { instagram?: string; website?: string } {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (/^https?:\/\//i.test(trimmed) || /\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
    return { website: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}` };
  }
  return { instagram: trimmed.replace(/^@+/, '') };
}

// Builds the "Create a café record from this" link on a café-partner
// survey card — carries over exactly the fields that exist on both sides
// (name, area, contact) as query params /admin/cafes/new reads to prefill
// the editor. Nothing here writes anything; the founder still reviews and
// saves.
export function cafeCreateHref(answers: Record<string, unknown>): string {
  const params = new URLSearchParams();
  const name = answers.cafeName;
  const area = answers.cityArea;
  const email = answers.email;
  const igOrWeb = answers.instagramOrWebsite;
  if (typeof name === 'string' && name.trim()) params.set('name', name.trim());
  if (typeof area === 'string' && area.trim()) params.set('neighbourhood', area.trim());
  if (typeof email === 'string' && email.trim()) params.set('email', email.trim());
  if (typeof igOrWeb === 'string' && igOrWeb.trim()) {
    const { instagram, website } = splitInstagramOrWebsite(igOrWeb);
    if (instagram) params.set('instagram', instagram);
    if (website) params.set('website', website);
  }
  const qs = params.toString();
  return qs ? `/admin/cafes/new?${qs}` : '/admin/cafes/new';
}
