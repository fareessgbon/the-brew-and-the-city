// Pure CSV-row validation for the admin café importer — split out of
// app/admin/actions.ts so it's unit-testable without a Supabase/Next.js
// runtime (Server Actions can't be called directly from a plain test).
// Behavior is unchanged from before the split; see
// lib/admin/__tests__/csvImport.test.ts.

import { PRIMARY_DRINK_CATEGORIES } from '@/lib/matching';
import type { Database, DrinkCategory, PartnerStatus } from '@/lib/supabase/types';

export type CafeInsert = Database['public']['Tables']['cafes']['Insert'];

export const PARTNER_STATUSES: PartnerStatus[] = ['listed', 'partner', 'featured', 'founding_partner'];

export interface CsvRowResult {
  row: number;
  name: string;
  slug: string;
  action: 'create' | 'update' | 'reject';
  errors: string[];
}

export interface ValidatedCsvRow extends CsvRowResult {
  payload?: CafeInsert;
}

// Return shape of importCafesCsv (app/admin/actions.ts). Defined here, not
// there — a 'use server' file's named exports must all be async functions
// (Turbopack's server-actions transform statically enumerates every export
// of such a file expecting exactly that; even a type-only export trips it,
// despite being erased at compile time — see the CsvRowResult re-export
// this replaced, and the build error it produced).
export interface CsvImportResult {
  created: number;
  updated: number;
  rejected: number;
  errors: string[];
}

const CSV_SCORE_FIELDS: [string, string][] = [
  ['drink', 'Drink'],
  ['energy', 'Energy'],
  ['aesthetic', 'Aesthetic'],
  ['pace', 'Pace'],
  ['adventure', 'Adventure'],
  ['price', 'Price'],
  ['food', 'Food'],
];

// Shared by previewCafesCsv (dry run) and importCafesCsv (the real write) so
// a row that previews as valid always imports the same way. Flags, per row:
// missing name/slug, a slug repeated earlier in the same file, out-of-range
// or non-numeric scores, and unrecognized partner_status/drink_categories
// values — rather than silently coercing bad data like the old importer
// did. address is passed through as-is (optional); importCafesCsv geocodes
// it into latitude/longitude at import time (see lib/server/geocode.ts) —
// deliberately not done here, since this function stays a pure,
// network-free function unit-testable without a Supabase/Next.js runtime.
export function validateCsvRows(records: Record<string, string>[], existingSlugs: Set<string>): ValidatedCsvRow[] {
  const seenSlugs = new Map<string, number>();

  return records.map((row, i) => {
    const rowNum = i + 2; // header is row 1
    const errors: string[] = [];
    const name = row.name?.trim() ?? '';
    const slug = (row.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!name) errors.push('Missing name.');
    if (!slug) errors.push('Missing slug.');
    if (slug) {
      const firstSeenAt = seenSlugs.get(slug);
      if (firstSeenAt) errors.push(`Duplicate slug "${slug}" — already used by row ${firstSeenAt} in this file.`);
      else seenSlugs.set(slug, rowNum);
    }

    const scores: Record<string, number> = {};
    for (const [key, label] of CSV_SCORE_FIELDS) {
      const raw = row[key]?.trim();
      if (!raw) {
        errors.push(`Missing ${label} score.`);
        continue;
      }
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        errors.push(`${label} score must be a number from 0-100 (got "${raw}").`);
        continue;
      }
      scores[`${key}_score`] = Math.round(num);
    }

    let partnerStatus: PartnerStatus = 'listed';
    const rawStatus = row.partner_status?.trim();
    if (rawStatus) {
      if (!PARTNER_STATUSES.includes(rawStatus as PartnerStatus)) {
        errors.push(`Unknown partner_status "${rawStatus}" — must be one of ${PARTNER_STATUSES.join(', ')}.`);
      } else {
        partnerStatus = rawStatus as PartnerStatus;
      }
    }

    let drinkCategories: DrinkCategory[] = [...PRIMARY_DRINK_CATEGORIES];
    const rawCategories = row.drink_categories?.trim();
    if (rawCategories) {
      const tokens = rawCategories.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      const invalid = tokens.filter((t) => !PRIMARY_DRINK_CATEGORIES.includes(t as DrinkCategory));
      if (invalid.length > 0) {
        errors.push(`Unknown drink category "${invalid.join(', ')}" — must be from ${PRIMARY_DRINK_CATEGORIES.join(', ')}.`);
      } else {
        drinkCategories = tokens as DrinkCategory[];
      }
    }

    const action: CsvRowResult['action'] = errors.length > 0 ? 'reject' : existingSlugs.has(slug) ? 'update' : 'create';
    const payload =
      errors.length === 0
        ? {
            name,
            slug,
            neighbourhood: row.neighbourhood?.trim() || null,
            // Omitted entirely (not set to null/empty) when the row leaves
            // this blank, so upsert leaves an existing café's address (and
            // the coordinates importCafesCsv geocodes from it) alone
            // instead of clobbering them back to unset.
            ...(row.address?.trim() ? { address: row.address.trim() } : {}),
            partner_status: partnerStatus,
            drink_categories: drinkCategories,
            ...scores,
          }
        : undefined;

    return { row: rowNum, name, slug, action, errors, payload };
  });
}
