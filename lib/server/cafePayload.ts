// Validates a café record posted from /admin/cafes into the exact column
// shape the `cafes` table expects.
//
// The table's own CHECK constraints (scores 0–100, partner_status enum,
// price_band enum) would already reject bad values — this exists so a typo
// comes back as "Latitude must be between -90 and 90" instead of a raw
// Postgres constraint name, and so the editor can't quietly write a string
// into a numeric column and get a 500 for it.

import {
  CITIES,
  DIMS,
  DAYS,
  PARTNER_STATUSES,
  PRICE_BANDS,
  PRIMARY_DRINK_CATEGORIES,
  type Day,
  type OpeningHours,
} from '@/lib/data/cafeFields';
import type { Database } from '@/lib/supabase/types';

type CafeWrite = Database['public']['Tables']['cafes']['Insert'];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Blank is how the form says "not set" — an empty string in a text column
// would make `neighbourhood ?? 'Neighbourhood TBD'` on the homepage print
// an empty area instead of the fallback.
function optionalText(value: unknown, max = 300): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed.slice(0, max);
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export interface ParseResult {
  data?: CafeWrite;
  error?: string;
}

// `partial` is the difference between POST (create — name and slug have to
// be there) and PATCH (update — only send what changed).
export function parseCafePayload(body: unknown, { partial }: { partial: boolean }): ParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request.' };
  }
  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if ('name' in input || !partial) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) return { error: 'A café needs a name.' };
    if (name.length > 120) return { error: 'That name is too long (120 characters max).' };
    out.name = name;
  }

  if ('slug' in input || !partial) {
    const slug = typeof input.slug === 'string' ? input.slug.trim().toLowerCase() : '';
    if (!slug) return { error: 'A café needs a URL slug.' };
    if (!SLUG_PATTERN.test(slug)) {
      return { error: 'Slug can only use lowercase letters, numbers and single hyphens.' };
    }
    out.slug = slug;
  }

  if ('city' in input) {
    if (typeof input.city !== 'string' || !CITIES.includes(input.city as never)) {
      return { error: 'Unknown city.' };
    }
    out.city = input.city;
  }

  for (const field of ['neighbourhood', 'address', 'website_url', 'instagram_handle', 'contact_email', 'contact_phone'] as const) {
    const parsed = optionalText(input[field], field === 'address' ? 300 : 200);
    if (parsed !== undefined) out[field] = parsed;
  }

  // Stored bare, without the @ — the display side adds it back, so one
  // café isn't "@monogram" and the next "monogram" depending on how it
  // was typed in.
  if (typeof out.instagram_handle === 'string') {
    out.instagram_handle = (out.instagram_handle as string).replace(/^@+/, '').trim() || null;
  }

  const email = out.contact_email;
  if (typeof email === 'string' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'That contact email doesn’t look like an email address.' };
  }

  const lat = optionalNumber(input.latitude);
  if (lat !== undefined) {
    if (lat !== null && (lat < -90 || lat > 90)) return { error: 'Latitude must be between -90 and 90.' };
    out.latitude = lat;
  }
  const lng = optionalNumber(input.longitude);
  if (lng !== undefined) {
    if (lng !== null && (lng < -180 || lng > 180)) return { error: 'Longitude must be between -180 and 180.' };
    out.longitude = lng;
  }

  if ('price_band' in input) {
    const band = optionalText(input.price_band, 3);
    if (band !== null && band !== undefined && !PRICE_BANDS.includes(band as never)) {
      return { error: 'Price band must be $, $$ or $$$.' };
    }
    out.price_band = band ?? null;
  }

  if ('drink_categories' in input) {
    const raw = input.drink_categories;
    if (!Array.isArray(raw) || raw.some((c) => typeof c !== 'string' || !PRIMARY_DRINK_CATEGORIES.includes(c as never))) {
      return { error: 'Unknown drink category.' };
    }
    // Deduped and put back in the canonical order, so two cafés with the
    // same categories always store the same array.
    out.drink_categories = PRIMARY_DRINK_CATEGORIES.filter((c) => raw.includes(c));
  }

  if ('opening_hours' in input) {
    const raw = input.opening_hours;
    if (raw === null) {
      out.opening_hours = null;
    } else if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { error: 'Opening hours are in an unexpected shape.' };
    } else {
      const hours: OpeningHours = {};
      for (const day of DAYS) {
        const pair = (raw as Record<string, unknown>)[day];
        if (pair == null) continue; // a missing day is a closed day
        if (!Array.isArray(pair) || pair.length !== 2 || pair.some((t) => typeof t !== 'string' || !TIME_PATTERN.test(t))) {
          return { error: `Opening hours for ${day} need an open and close time in 24-hour HH:MM.` };
        }
        hours[day as Day] = [pair[0] as string, pair[1] as string];
      }
      out.opening_hours = Object.keys(hours).length > 0 ? hours : null;
    }
  }

  if ('partner_status' in input) {
    if (typeof input.partner_status !== 'string' || !PARTNER_STATUSES.includes(input.partner_status as never)) {
      return { error: 'Unknown partner status.' };
    }
    out.partner_status = input.partner_status;
  }

  if ('is_active' in input) {
    if (typeof input.is_active !== 'boolean') return { error: 'Invalid active flag.' };
    out.is_active = input.is_active;
  }

  // The form sends a boolean; the column is a timestamp. Ticking the box
  // stamps now, clearing it wipes the date — which is the honest behaviour,
  // since an unverified café shouldn't keep a verification date from a
  // previous pass (the homepage's sample-data disclaimer reads this).
  if ('verified' in input) {
    if (typeof input.verified !== 'boolean') return { error: 'Invalid verified flag.' };
    out.verified_at = input.verified ? new Date().toISOString() : null;
  }

  for (const dim of DIMS) {
    const key = `${dim}_score`;
    if (!(key in input)) continue;
    const n = optionalNumber(input[key]);
    if (n === undefined || n === null || !Number.isInteger(n) || n < 0 || n > 100) {
      return { error: `${dim[0].toUpperCase()}${dim.slice(1)} score must be a whole number from 0 to 100.` };
    }
    out[key] = n;
  }

  if (Object.keys(out).length === 0) {
    return { error: 'Nothing to update.' };
  }

  return { data: out as CafeWrite };
}

// Postgres 23505 on cafes_slug_key is the one write failure that's the
// admin's to fix rather than a bug to log — two cafés can't share a slug.
export function isDuplicateSlug(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}
