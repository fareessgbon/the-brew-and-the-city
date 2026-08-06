'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parse } from 'csv-parse/sync';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';
import { DIMS, PRIMARY_DRINK_CATEGORIES } from '@/lib/matching';
import { logAdminAction } from '@/lib/server/auditLog';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { PARTNER_STATUSES, validateCsvRows, type CsvRowResult, type ValidatedCsvRow } from '@/lib/admin/csvImport';
import { MAX_REWARD_ITEMS_PER_CAFE, rewardItemFieldsFromForm } from '@/lib/admin/rewardItems';
import { cafeDeletionBlockerMessage, rewardItemDeletionBlockerMessage } from '@/lib/admin/deletionGuards';
import { generatePortalCredential, planApplicationApproval, slugify } from '@/lib/admin/partnerOnboarding';
import type { DrinkCategory, FeatureFlagKey, MenuItemCategory, NoiseLevel, PartnerLifecycleStatus, PartnerStatus, PriceBand } from '@/lib/supabase/types';

// Re-exported so components (e.g. CsvUploadForm) importing this type from
// the actions module — where the rest of the CSV import API lives — don't
// need to know the validation logic moved to lib/admin/csvImport.ts.
export type { CsvRowResult };

const SCORE_FIELDS = ['drink_score', 'energy_score', 'aesthetic_score', 'pace_score', 'adventure_score', 'price_score', 'food_score'] as const;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const MENU_CATEGORIES: MenuItemCategory[] = ['matcha', 'coffee', 'tea', 'food', 'other'];

// §3.0.1 / §3.1b — launch capacity: first 15 approved cafés for Founding
// Partner, Featured capped at 8 at any time (a capacity limit, not
// scarcity marketing — see §3.1d).
const FOUNDING_PARTNER_CAP = 15;
const FEATURED_CAP = 8;

async function assertTierCapacity(supabase: ReturnType<typeof createAdminClient>, status: PartnerStatus, excludeCafeId?: string) {
  if (status !== 'founding_partner' && status !== 'featured') return;
  const cap = status === 'founding_partner' ? FOUNDING_PARTNER_CAP : FEATURED_CAP;

  let query = supabase.from('cafes').select('id', { count: 'exact', head: true }).eq('partner_status', status);
  if (excludeCafeId) query = query.neq('id', excludeCafeId);
  const { count } = await query;

  if ((count ?? 0) >= cap) {
    const label = status === 'founding_partner' ? 'Founding Partner' : 'Featured';
    throw new Error(`${label} is full (${cap}/${cap}) — move another café out of ${label} first.`);
  }
}

const PRICE_BANDS: PriceBand[] = ['$', '$$', '$$$'];
const NOISE_LEVELS: NoiseLevel[] = ['quiet', 'moderate', 'loud'];
const PARTNER_LIFECYCLE_STATUSES: PartnerLifecycleStatus[] = ['active', 'paused', 'downgraded', 'cancelled'];

function parsePartnerStatus(value: unknown): PartnerStatus {
  return PARTNER_STATUSES.includes(value as PartnerStatus) ? (value as PartnerStatus) : 'listed';
}

function parseLifecycleStatus(value: unknown): PartnerLifecycleStatus {
  return PARTNER_LIFECYCLE_STATUSES.includes(value as PartnerLifecycleStatus) ? (value as PartnerLifecycleStatus) : 'active';
}

function parsePriceBand(value: unknown): PriceBand | null {
  return PRICE_BANDS.includes(value as PriceBand) ? (value as PriceBand) : null;
}

function parseNoiseLevel(value: unknown): NoiseLevel | null {
  return NOISE_LEVELS.includes(value as NoiseLevel) ? (value as NoiseLevel) : null;
}

function parseMenuCategory(value: unknown): MenuItemCategory {
  return MENU_CATEGORIES.includes(value as MenuItemCategory) ? (value as MenuItemCategory) : 'other';
}

function clampScore(n: unknown): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function readOpeningHours(formData: FormData): Record<string, [string, string]> | null {
  const hours: Record<string, [string, string]> = {};
  for (const day of DAYS) {
    const open = formData.get(`hours_${day}_open`);
    const close = formData.get(`hours_${day}_close`);
    if (typeof open === 'string' && typeof close === 'string' && open && close) {
      hours[day] = [open, close];
    }
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

function cafeFieldsFromForm(formData: FormData, previousVerifiedAt: string | null = null) {
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const neighbourhood = String(formData.get('neighbourhood') ?? '').trim() || null;
  const address = String(formData.get('address') ?? '').trim() || null;
  const latitude = formData.get('latitude') ? Number(formData.get('latitude')) : null;
  const longitude = formData.get('longitude') ? Number(formData.get('longitude')) : null;
  const partner_status = parsePartnerStatus(formData.get('partner_status'));
  const isVerifiedNow = formData.get('verified') === 'true';
  const is_match_ready = formData.get('is_match_ready') === 'true';
  const portal_pin = String(formData.get('portal_pin') ?? '').trim() || null;
  const drink_categories = PRIMARY_DRINK_CATEGORIES.filter((c) => formData.getAll('drink_categories').includes(c)) as DrinkCategory[];

  const scores: Record<string, number> = {};
  DIMS.forEach((dim, i) => {
    scores[SCORE_FIELDS[i]] = clampScore(formData.get(dim));
  });

  const is_active = formData.get('is_active') === 'true';
  const contact_phone = String(formData.get('contact_phone') ?? '').trim() || null;
  const contact_email = String(formData.get('contact_email') ?? '').trim() || null;
  const instagram_handle = String(formData.get('instagram_handle') ?? '').trim() || null;
  const website_url = String(formData.get('website_url') ?? '').trim() || null;
  const price_band = parsePriceBand(formData.get('price_band'));
  const stamps_enabled = formData.get('stamps_enabled') === 'true';
  const rewards_enabled = formData.get('rewards_enabled') === 'true';

  return {
    name,
    slug,
    neighbourhood,
    address,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    partner_status,
    opening_hours: readOpeningHours(formData),
    // Keep the original verification timestamp if it was already verified
    // and still is; set it fresh the moment it's newly checked; clear it if
    // unchecked — re-verifying later gets a new, honest timestamp.
    verified_at: isVerifiedNow ? (previousVerifiedAt ?? new Date().toISOString()) : null,
    is_match_ready,
    portal_pin,
    drink_categories,
    is_active,
    contact_phone,
    contact_email,
    instagram_handle,
    website_url,
    price_band,
    stamps_enabled,
    rewards_enabled,
    ...scores,
  };
}

// §7.2 hard filters — cafe_attributes is a separate 1:1 table (unset until
// an admin actually confirms it), read from the same form submission as the
// rest of the café fields rather than a second form.
function cafeAttributesFromForm(cafeId: string, formData: FormData) {
  const waitMinutesRaw = formData.get('average_wait_minutes');
  const average_wait_minutes = waitMinutesRaw ? Number(waitMinutesRaw) : null;
  return {
    cafe_id: cafeId,
    oat: formData.get('oat') === 'true',
    gluten_free: formData.get('gluten_free') === 'true',
    wheelchair: formData.get('wheelchair') === 'true',
    wifi: formData.get('wifi') === 'true',
    outlets: formData.get('outlets') === 'true',
    outdoor_seating: formData.get('outdoor_seating') === 'true',
    seating_notes: String(formData.get('seating_notes') ?? '').trim() || null,
    noise_level: parseNoiseLevel(formData.get('noise_level')),
    average_wait_minutes: Number.isFinite(average_wait_minutes) ? average_wait_minutes : null,
    food_program: formData.get('food_program') === 'true',
    cash_accepted: formData.get('cash_accepted') === 'true',
  };
}

// §2 "Add photos" — uploads any newly-selected files to the public
// cafe-photos bucket, drops any URLs the admin checked "Remove", and
// returns the resulting photos array to write onto the café row. Runs
// after the café exists (createCafe) or against its known id (updateCafe)
// so uploaded paths can be namespaced by café id.
// Mirrors the cafe-photos bucket's own configured limits (see
// PRODUCTION_CHECKLIST.md — allowed_mime_types/file_size_limit are already
// enforced server-side by Supabase Storage regardless of this check, so a
// disallowed file can never actually land in the bucket either way) —
// checking here first just turns a raw storage-API error into the same
// kind of friendly, expected message every other upload path in this app
// already gives.
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024;

async function applyPhotoChanges(supabase: ReturnType<typeof createAdminClient>, cafeId: string, formData: FormData, existingPhotos: string[]): Promise<string[]> {
  const toRemove = new Set(formData.getAll('remove_photos').map(String));
  let photos = existingPhotos.filter((url) => !toRemove.has(url));

  const files = formData.getAll('new_photos').filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      throw new Error(`"${file.name}" isn't a supported image type — use JPEG, PNG, or WebP.`);
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      throw new Error(`"${file.name}" is too large (8 MB max).`);
    }
    const path = `${cafeId}/${randomUUID()}-${file.name}`;
    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage.from('cafe-photos').upload(path, bytes, { contentType: file.type });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data: pub } = supabase.storage.from('cafe-photos').getPublicUrl(path);
    photos = [...photos, pub.publicUrl];
  }

  return photos;
}

export async function createCafe(formData: FormData) {
  const admin = await requireAdmin();
  const fields = cafeFieldsFromForm(formData);
  if (!fields.name || !fields.slug) throw new Error('Name and slug are required.');

  const supabase = createAdminClient();
  await assertTierCapacity(supabase, fields.partner_status);

  const founding_partner_started_at = fields.partner_status === 'founding_partner' ? new Date().toISOString() : null;
  const { data: created, error } = await supabase
    .from('cafes')
    .insert({ ...fields, founding_partner_started_at })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  // Photos are uploaded after the insert so paths can be namespaced by the
  // café's real id, then written back in a second, narrow update.
  const photos = await applyPhotoChanges(supabase, created.id, formData, []);
  if (photos.length > 0) {
    const { error: photoError } = await supabase.from('cafes').update({ photos }).eq('id', created.id);
    if (photoError) throw new Error(photoError.message);
  }

  const { error: attrError } = await supabase.from('cafe_attributes').upsert(cafeAttributesFromForm(created.id, formData), { onConflict: 'cafe_id' });
  if (attrError) throw new Error(attrError.message);

  // portal_pin is a live credential, not a field worth diffing — same
  // reasoning as approveApplication()'s café-creation audit entry below.
  const createdCafeForAudit: Record<string, unknown> = { ...fields, photos };
  delete createdCafeForAudit.portal_pin;
  await logAdminAction(admin.email ?? 'unknown', 'cafe.create', `Created café "${fields.name}" (${fields.slug})`, { cafeId: created.id }, {
    recordType: 'cafe',
    recordId: created.id,
    previousValue: null,
    newValue: createdCafeForAudit,
  });
  await trackServerEvent('cafe_created', null, { cafeId: created.id, source: 'admin_manual' });

  revalidatePath('/admin/cafes');
  redirect('/admin/cafes');
}

export async function updateCafe(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from('cafes').select('*').eq('id', id).maybeSingle();
  const fields = cafeFieldsFromForm(formData, existing?.verified_at ?? null);
  if (!fields.name || !fields.slug) throw new Error('Name and slug are required.');

  // Only re-check capacity when actually moving into a capped tier — saving
  // an already-Featured café's other fields shouldn't self-block on its own
  // slot, and moving out never needs a capacity check.
  if (fields.partner_status !== existing?.partner_status) {
    await assertTierCapacity(supabase, fields.partner_status, id);
  }

  const founding_partner_started_at =
    fields.partner_status === 'founding_partner'
      ? (existing?.partner_status === 'founding_partner' ? existing.founding_partner_started_at : new Date().toISOString())
      : null;

  const photos = await applyPhotoChanges(supabase, id, formData, existing?.photos ?? []);

  const { error } = await supabase
    .from('cafes')
    .update({ ...fields, photos, founding_partner_started_at, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);

  const { error: attrError } = await supabase.from('cafe_attributes').upsert(cafeAttributesFromForm(id, formData), { onConflict: 'cafe_id' });
  if (attrError) throw new Error(attrError.message);

  // portal_pin is a live credential, not a field worth diffing — strip it
  // from both sides so neither the old nor the new PIN ever lands in the
  // audit log, which is broader-access and longer-retention than an
  // operational credential should be (same reasoning already applied to
  // approveApplication()'s café-creation entry).
  const previousCafeForAudit: Record<string, unknown> | null = existing ? { ...(existing as Record<string, unknown>) } : null;
  if (previousCafeForAudit) delete previousCafeForAudit.portal_pin;
  const updatedCafeForAudit: Record<string, unknown> = { ...fields, photos };
  delete updatedCafeForAudit.portal_pin;

  await logAdminAction(admin.email ?? 'unknown', 'cafe.update', `Updated café "${fields.name}" (${fields.slug})`, { cafeId: id }, {
    recordType: 'cafe',
    recordId: id,
    previousValue: previousCafeForAudit,
    newValue: updatedCafeForAudit,
  });

  revalidatePath('/admin/cafes');
  revalidatePath(`/admin/cafes/${id}`);
  redirect('/admin/cafes');
}

// Not exposed in the admin UI (see CafeForm's "Active" checkbox for the
// normal, reversible way to hide a café) — kept as a guarded server action
// rather than removed outright, for the rare case of a café created by
// mistake with zero real activity. cafes.id cascades into visits/menu_items/
// reward_items/saved_cafes on delete, and rewards.redeemed_at_cafe_id /
// pending_cafe_id have no ON DELETE at all (a stray redemption would throw a
// raw FK error instead of a friendly one) — so anything with real history
// must be deactivated, never deleted.
async function assertCafeHasNoHistory(supabase: ReturnType<typeof createAdminClient>, cafeId: string) {
  const [visits, redeemedRewards, pendingRewards, menuItems, rewardItems, savedCafes] = await Promise.all([
    supabase.from('visits').select('id', { count: 'exact', head: true }).eq('cafe_id', cafeId),
    supabase.from('rewards').select('id', { count: 'exact', head: true }).eq('redeemed_at_cafe_id', cafeId),
    supabase.from('rewards').select('id', { count: 'exact', head: true }).eq('pending_cafe_id', cafeId),
    supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('cafe_id', cafeId),
    supabase.from('reward_items').select('id', { count: 'exact', head: true }).eq('cafe_id', cafeId),
    supabase.from('saved_cafes').select('id', { count: 'exact', head: true }).eq('cafe_id', cafeId),
  ]);

  const message = cafeDeletionBlockerMessage({
    visits: visits.count ?? 0,
    redeemedRewards: redeemedRewards.count ?? 0,
    pendingRewards: pendingRewards.count ?? 0,
    menuItems: menuItems.count ?? 0,
    rewardItems: rewardItems.count ?? 0,
    savedCafes: savedCafes.count ?? 0,
  });
  if (message) throw new Error(message);
}

export async function deleteCafe(id: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: cafe } = await supabase.from('cafes').select('name, slug').eq('id', id).maybeSingle();
  if (!cafe) throw new Error('Café not found.');

  await assertCafeHasNoHistory(supabase, id);

  const { error } = await supabase.from('cafes').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'cafe.delete',
    `Deleted café "${cafe?.name ?? id}"${cafe?.slug ? ` (${cafe.slug})` : ''}`,
    { cafeId: id },
    { recordType: 'cafe', recordId: id, previousValue: cafe ? { name: cafe.name, slug: cafe.slug } : null, newValue: null },
  );

  revalidatePath('/admin/cafes');
  redirect('/admin/cafes');
}

// §9 partner administration — contract/billing terms and lifecycle status,
// kept separate from partner_status (the tier). partner_status affects
// promotion/founding-cap rules and is edited on the café form; these fields
// are business-side bookkeeping and never feed the matching engine.
export async function updatePartnerAdmin(cafeId: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('cafes')
    .select('name, contract_start_date, contract_end_date, monthly_price_cents, primary_contact_name, primary_contact_email, marketing_deliverables_owed, partner_lifecycle_status, monthly_redemption_cap')
    .eq('id', cafeId)
    .maybeSingle();
  if (!existing) throw new Error('Café not found.');

  const monthlyPriceDollars = formData.get('monthly_price_dollars');
  const redemptionCapRaw = formData.get('monthly_redemption_cap');
  const redemptionCap = redemptionCapRaw ? Number(redemptionCapRaw) : existing.monthly_redemption_cap;

  const fields = {
    contract_start_date: String(formData.get('contract_start_date') ?? '').trim() || null,
    contract_end_date: String(formData.get('contract_end_date') ?? '').trim() || null,
    monthly_price_cents: monthlyPriceDollars ? Math.round(Number(monthlyPriceDollars) * 100) : null,
    primary_contact_name: String(formData.get('primary_contact_name') ?? '').trim() || null,
    primary_contact_email: String(formData.get('primary_contact_email') ?? '').trim() || null,
    marketing_deliverables_owed: String(formData.get('marketing_deliverables_owed') ?? '').trim() || null,
    partner_lifecycle_status: parseLifecycleStatus(formData.get('partner_lifecycle_status')),
    monthly_redemption_cap: Number.isFinite(redemptionCap) && redemptionCap > 0 ? Math.round(redemptionCap) : existing.monthly_redemption_cap,
  };

  const { error } = await supabase.from('cafes').update(fields).eq('id', cafeId);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'partner.update',
    `Updated partner administration for "${existing.name}"`,
    { cafeId },
    {
      recordType: 'cafe',
      recordId: cafeId,
      previousValue: {
        contract_start_date: existing.contract_start_date,
        contract_end_date: existing.contract_end_date,
        monthly_price_cents: existing.monthly_price_cents,
        primary_contact_name: existing.primary_contact_name,
        primary_contact_email: existing.primary_contact_email,
        marketing_deliverables_owed: existing.marketing_deliverables_owed,
        partner_lifecycle_status: existing.partner_lifecycle_status,
        monthly_redemption_cap: existing.monthly_redemption_cap,
      },
      newValue: fields,
    },
  );

  revalidatePath('/admin/partners');
  redirect(`/admin/partners/${cafeId}`);
}

async function parseCsvFile(formData: FormData): Promise<{ records: Record<string, string>[] } | { errors: string[] }> {
  const file = formData.get('file');
  if (!(file instanceof File)) return { errors: ['No file uploaded.'] };

  const text = await file.text();
  try {
    const records = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    if (records.length === 0) return { errors: ['CSV has no data rows.'] };
    return { records };
  } catch (err) {
    return { errors: [`Could not parse CSV: ${err instanceof Error ? err.message : String(err)}`] };
  }
}

async function validateCsvFile(formData: FormData): Promise<ValidatedCsvRow[]> {
  const parsed = await parseCsvFile(formData);
  if ('errors' in parsed) return [{ row: 0, name: '', slug: '', action: 'reject', errors: parsed.errors }];

  const supabase = createAdminClient();
  const slugs = parsed.records.map((r) => (r.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')).filter(Boolean);
  const { data: existing } = await supabase.from('cafes').select('slug').in('slug', slugs.length > 0 ? slugs : ['']);
  const existingSlugs = new Set((existing ?? []).map((c) => c.slug));

  return validateCsvRows(parsed.records, existingSlugs);
}

// Expected header row: name,slug,neighbourhood,drink,energy,aesthetic,pace,adventure,price,food,partner_status,drink_categories,latitude,longitude
// drink_categories is optional, semicolon- or comma-separated (coffee;matcha;tea_chai;refreshers_other) — defaults to all four.
// latitude/longitude are optional too — provide both or leave both blank; a
// lone coordinate is rejected, and omitting both leaves an existing café's
// coordinates untouched on update rather than clearing them.
// Dry run — validates every row and reports what importCafesCsv would do,
// without writing anything, so the admin can review and correct before committing.
export async function previewCafesCsv(formData: FormData): Promise<CsvRowResult[]> {
  await requireAdmin();
  const results = await validateCsvFile(formData);
  return results.map(({ row, name, slug, action, errors }) => ({ row, name, slug, action, errors }));
}

export interface CsvImportResult {
  created: number;
  updated: number;
  rejected: number;
  errors: string[];
}

export async function importCafesCsv(formData: FormData): Promise<CsvImportResult> {
  const admin = await requireAdmin();
  const results = await validateCsvFile(formData);

  const supabase = createAdminClient();
  let created = 0;
  let updated = 0;
  let rejected = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (result.action === 'reject' || !result.payload) {
      rejected++;
      if (result.errors.length > 0) errors.push(`Row ${result.row}${result.name ? ` (${result.name})` : ''}: ${result.errors.join(' ')}`);
      continue;
    }
    const { error } = await supabase.from('cafes').upsert(result.payload, { onConflict: 'slug' });
    if (error) {
      rejected++;
      errors.push(`Row ${result.row} (${result.name}): ${error.message}`);
    } else if (result.action === 'update') {
      updated++;
    } else {
      created++;
    }
  }

  if (created > 0 || updated > 0) {
    await logAdminAction(
      admin.email ?? 'unknown',
      'cafe.csv_import',
      `Imported CSV: ${created} created, ${updated} updated, ${rejected} rejected`,
      { created, updated, rejected, errorCount: errors.length },
      { recordType: 'cafe_import', newValue: { created, updated, rejected } },
    );
  }

  revalidatePath('/admin/cafes');
  return { created, updated, rejected, errors };
}

export async function addMenuItem(cafeId: string, formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const priceDollars = formData.get('price');
  const category = parseMenuCategory(formData.get('category'));
  if (!name) throw new Error('Menu item name is required.');

  const supabase = createAdminClient();
  const { data: created, error } = await supabase
    .from('menu_items')
    .insert({
      cafe_id: cafeId,
      name,
      description,
      price_cents: priceDollars ? Math.round(Number(priceDollars) * 100) : null,
      category,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'menu_item.create',
    `Added menu item "${name}"`,
    { cafeId },
    { recordType: 'menu_item', recordId: created.id, previousValue: null, newValue: { name, description, category } },
  );

  revalidatePath(`/admin/cafes/${cafeId}`);
}

export async function deleteMenuItem(id: string, cafeId: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: item } = await supabase.from('menu_items').select('name').eq('id', id).maybeSingle();
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'menu_item.delete',
    `Deleted menu item "${item?.name ?? id}"`,
    { cafeId },
    { recordType: 'menu_item', recordId: id, previousValue: item ? { name: item.name } : null, newValue: null },
  );

  revalidatePath(`/admin/cafes/${cafeId}`);
}

// Not exposed anywhere but here (see deleteRewardItem below) — rewards.reward_item_id
// has no ON DELETE clause, so deleting an item ever activated/redeemed would
// otherwise throw a raw FK error instead of a friendly one.
async function assertRewardItemHasNoRedemptions(supabase: ReturnType<typeof createAdminClient>, itemId: string) {
  const { count } = await supabase.from('rewards').select('id', { count: 'exact', head: true }).eq('reward_item_id', itemId);
  const message = rewardItemDeletionBlockerMessage(count ?? 0);
  if (message) throw new Error(message);
}

export async function addRewardItem(cafeId: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { count } = await supabase.from('reward_items').select('id', { count: 'exact', head: true }).eq('cafe_id', cafeId);
  if ((count ?? 0) >= MAX_REWARD_ITEMS_PER_CAFE) {
    throw new Error(`This café already has ${MAX_REWARD_ITEMS_PER_CAFE} eligible items — remove one before adding another.`);
  }

  const result = rewardItemFieldsFromForm(formData);
  if ('error' in result) throw new Error(result.error);

  const { data: created, error } = await supabase
    .from('reward_items')
    .insert({ cafe_id: cafeId, ...result.fields })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'reward_item.create',
    `Added reward item "${result.fields.name}"`,
    { cafeId },
    { recordType: 'reward_item', recordId: created.id, previousValue: null, newValue: { ...result.fields } },
  );
  await trackServerEvent('reward_item_created', null, { cafeId, rewardItemId: created.id, source: 'admin' });

  revalidatePath(`/admin/cafes/${cafeId}`);
}

export async function updateRewardItem(id: string, cafeId: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from('reward_items').select('*').eq('id', id).maybeSingle();
  if (!existing) throw new Error('Reward item not found.');

  const result = rewardItemFieldsFromForm(formData);
  if ('error' in result) throw new Error(result.error);

  const { error } = await supabase
    .from('reward_items')
    .update({ ...result.fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'reward_item.update',
    `Updated reward item "${result.fields.name}"`,
    { cafeId },
    {
      recordType: 'reward_item',
      recordId: id,
      previousValue: {
        name: existing.name,
        description: existing.description,
        category: existing.category,
        price_cents: existing.price_cents,
        reimbursement_cents: existing.reimbursement_cents,
        monthly_cap: existing.monthly_cap,
        is_available: existing.is_available,
      },
      newValue: { ...result.fields },
    },
  );

  revalidatePath(`/admin/cafes/${cafeId}`);
}

export async function deleteRewardItem(id: string, cafeId: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from('reward_items').select('*').eq('id', id).maybeSingle();
  if (!existing) throw new Error('Reward item not found.');

  await assertRewardItemHasNoRedemptions(supabase, id);

  const { error } = await supabase.from('reward_items').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'reward_item.delete',
    `Deleted reward item "${existing.name}"`,
    { cafeId },
    {
      recordType: 'reward_item',
      recordId: id,
      previousValue: {
        name: existing.name,
        description: existing.description,
        category: existing.category,
        price_cents: existing.price_cents,
        reimbursement_cents: existing.reimbursement_cents,
        monthly_cap: existing.monthly_cap,
        is_available: existing.is_available,
      },
      newValue: null,
    },
  );

  revalidatePath(`/admin/cafes/${cafeId}`);
}

// §onboarding — approving creates the café automatically instead of
// leaving that as a disconnected manual follow-up. planApplicationApproval
// (lib/admin/partnerOnboarding.ts) decides *what* to do; everything here is
// the actual reads/writes carrying that plan out.
export async function approveApplication(id: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: application } = await supabase
    .from('partner_applications')
    .select('status, cafe_name, email, neighbourhood, instagram')
    .eq('id', id)
    .maybeSingle();
  if (!application) throw new Error('Application not found.');

  const baseSlug = slugify(application.cafe_name);
  const { data: collidingCafes } = await supabase.from('cafes').select('slug').like('slug', `${baseSlug}%`);
  const existingSlugs = new Set((collidingCafes ?? []).map((c) => c.slug));
  const portalCredential = generatePortalCredential();

  const plan = planApplicationApproval(application, existingSlugs, portalCredential);

  if (plan.action === 'skip') {
    // Already approved/rejected, or a second concurrent approval click —
    // nothing to do. Idempotent rather than erroring on a double-click.
    revalidatePath('/admin/applications');
    return;
  }

  // Claim the application *before* creating anything — this is the actual
  // race-safety guarantee, not just a decision made explicit. Two concurrent
  // approvals can both read 'pending' above; only one of these guarded
  // updates can match a row, since the first to run flips status away from
  // 'pending'. Checking `claimed.length` (not just `error`) matters: a
  // zero-row update returns no error, so a naive error-only check would let
  // the loser fall through and create a second, orphaned café anyway.
  const { data: claimed, error: claimError } = await supabase
    .from('partner_applications')
    .update({ status: 'approved' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id');
  if (claimError) throw new Error(claimError.message);
  if (!claimed || claimed.length === 0) {
    // Lost the race to another concurrent approval — nothing to do.
    revalidatePath('/admin/applications');
    return;
  }

  const { data: createdCafe, error: cafeError } = await supabase
    .from('cafes')
    .insert(plan.cafeFields)
    .select('id, name, slug')
    .single();
  if (cafeError) {
    // Roll back the claim so a genuine failure (not a race) leaves the
    // application retryable instead of stuck 'approved' with no café.
    await supabase.from('partner_applications').update({ status: 'pending' }).eq('id', id);
    throw new Error(cafeError.message);
  }

  const { error: appError } = await supabase.from('partner_applications').update({ cafe_id: createdCafe.id }).eq('id', id);
  if (appError) throw new Error(appError.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'application.approve',
    `Approved partner application from "${application.cafe_name}"`,
    { applicationId: id, cafeId: createdCafe.id },
    {
      recordType: 'partner_application',
      recordId: id,
      previousValue: { status: 'pending' },
      newValue: { status: 'approved', cafeId: createdCafe.id },
    },
  );

  // The generated portal credential is never written into the audit log —
  // it's a live secret, and audit logs are broader-access and
  // longer-retention than an operational credential should be. Only its
  // existence is recorded.
  const cafeFieldsForAudit: Record<string, unknown> = { ...plan.cafeFields };
  delete cafeFieldsForAudit.portal_pin;
  await logAdminAction(
    admin.email ?? 'unknown',
    'cafe.create',
    `Created café "${createdCafe.name}" (${createdCafe.slug}) from partner application`,
    { applicationId: id, portalCredentialGenerated: true },
    { recordType: 'cafe', recordId: createdCafe.id, previousValue: null, newValue: cafeFieldsForAudit },
  );
  await trackServerEvent('cafe_created', null, { cafeId: createdCafe.id, source: 'partner_application' });

  revalidatePath('/admin/applications');
  revalidatePath('/admin/cafes');
}

export async function rejectApplication(id: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: application } = await supabase.from('partner_applications').select('cafe_name').eq('id', id).maybeSingle();
  const { error } = await supabase.from('partner_applications').update({ status: 'rejected' }).eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'application.reject',
    `Rejected partner application from "${application?.cafe_name ?? id}"`,
    { applicationId: id },
    { recordType: 'partner_application', recordId: id, previousValue: { status: 'pending' }, newValue: { status: 'rejected' } },
  );

  revalidatePath('/admin/applications');
}

// Backup review path — the café portal is the primary way receipts get
// reviewed, but a café that hasn't set up its PIN yet (or is slow to check)
// shouldn't leave a member's stamp stuck indefinitely.
export async function reviewVisit(visitId: string, action: 'approve' | 'reject') {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const status = action === 'approve' ? 'approved' : 'rejected';
  const { data: updated, error } = await supabase
    .from('visits')
    .update({ status, stamp_awarded: action === 'approve', reviewed_at: new Date().toISOString(), reviewed_by: 'admin' })
    .eq('id', visitId)
    .eq('status', 'pending')
    .select('id, user_id, cafe_id');
  if (error) throw new Error(error.message);

  const updatedVisit = updated?.[0];
  if (updatedVisit) {
    await logAdminAction(
      admin.email ?? 'unknown',
      'visit.review',
      `${action === 'approve' ? 'Approved' : 'Rejected'} visit ${visitId} (admin backup review)`,
      { visitId, action },
      { recordType: 'visit', recordId: visitId, previousValue: { status: 'pending' }, newValue: { status } },
    );
    // Same event the café-portal review path fires (api/portal/visits/[visitId])
    // — this is the same product outcome, just reviewed by admin backup
    // instead of the café, and product metrics on "receipts approved/
    // rejected" shouldn't undercount whichever path handled it.
    await trackServerEvent(action === 'approve' ? 'receipt_approved' : 'receipt_rejected', updatedVisit.user_id, {
      visitId,
      cafeId: updatedVisit.cafe_id,
      reviewedBy: 'admin',
    });
  }

  revalidatePath('/admin/visits');
}

// §6 "force-add stamp" — overrides whatever the visit's current status is
// (pending, or already rejected by the café or a prior automatic check) and
// awards the stamp anyway. Unlike reviewVisit, this doesn't require
// status = 'pending' first — that's the whole point of a force override.
export async function forceAddStamp(visitId: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from('visits').select('status, stamp_awarded, user_id, cafe_id').eq('id', visitId).maybeSingle();
  if (!existing) throw new Error('Visit not found.');

  const { error } = await supabase
    .from('visits')
    .update({ status: 'approved', stamp_awarded: true, reviewed_at: new Date().toISOString(), reviewed_by: 'admin_force' })
    .eq('id', visitId);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'visit.force_add_stamp',
    `Force-added stamp for visit ${visitId} (was ${existing.status})`,
    { visitId, previousStatus: existing.status },
    { recordType: 'visit', recordId: visitId, previousValue: { status: existing.status, stamp_awarded: existing.stamp_awarded }, newValue: { status: 'approved', stamp_awarded: true } },
  );
  // Same end state as a normal approval (status: 'approved') — counts the
  // same way in product metrics; which admin action produced it is already
  // distinguishable in the audit log above if that distinction matters.
  await trackServerEvent('receipt_approved', existing.user_id, { visitId, cafeId: existing.cafe_id, reviewedBy: 'admin_force' });

  revalidatePath('/admin/visits');
}

// §20 — receipt images purge 30 days after resolution. No scheduled-job
// runner in this environment (see supabase/README or lib/supabase/README.md
// for why), so this is a real, working, admin-triggered action rather than
// a cron stub that never fires.
export async function purgeOldReceipts() {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: toPurge, error } = await supabase
    .from('visits')
    .select('id, receipt_image_path')
    .not('receipt_image_path', 'is', null)
    .not('reviewed_at', 'is', null)
    .lt('reviewed_at', cutoff);
  if (error) throw new Error(error.message);
  if (!toPurge || toPurge.length === 0) return { purged: 0 };

  const paths = toPurge.map((v) => v.receipt_image_path).filter((p): p is string => !!p);
  await supabase.storage.from('receipts').remove(paths);
  await supabase
    .from('visits')
    .update({ receipt_image_path: null })
    .in('id', toPurge.map((v) => v.id));

  await logAdminAction(admin.email ?? 'unknown', 'receipts.purge', `Purged ${toPurge.length} old receipt image(s)`, { purged: toPurge.length });

  revalidatePath('/admin/visits');
  return { purged: toPurge.length };
}

// §7 merchant-string manager — no OCR pipeline writes to this table yet
// (see migration 0015's comment), so today it's admin-maintained: an admin
// records the merchant-name variants they've seen on receipts and which
// café each belongs to, ready for a future OCR step to read from. A blank
// café leaves the row in the "unmatched" queue for later review.
export async function addMerchantString(formData: FormData) {
  const admin = await requireAdmin();
  const rawString = String(formData.get('raw_string') ?? '').trim();
  const cafeId = String(formData.get('cafe_id') ?? '').trim() || null;
  if (!rawString) throw new Error('Merchant string is required.');

  const supabase = createAdminClient();
  const { data: cafe } = cafeId ? await supabase.from('cafes').select('name').eq('id', cafeId).maybeSingle() : { data: null };
  const { error } = await supabase.from('merchant_strings').insert({ raw_string: rawString, cafe_id: cafeId });
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'merchant_string.add',
    `Added merchant string "${rawString}"${cafe ? ` → ${cafe.name}` : ' (unmatched)'}`,
    { rawString, cafeId },
    { recordType: 'merchant_string', newValue: { raw_string: rawString, cafe_id: cafeId } },
  );

  revalidatePath('/admin/merchant-strings');
}

export async function setMerchantStringCafe(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const cafeId = String(formData.get('cafe_id') ?? '').trim() || null;

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from('merchant_strings').select('raw_string, cafe_id').eq('id', id).maybeSingle();
  if (!existing) throw new Error('Merchant string not found.');

  const { data: cafe } = cafeId ? await supabase.from('cafes').select('name').eq('id', cafeId).maybeSingle() : { data: null };
  const { error } = await supabase.from('merchant_strings').update({ cafe_id: cafeId, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'merchant_string.map',
    `Mapped merchant string "${existing.raw_string}" → ${cafe ? cafe.name : 'unmatched'}`,
    { merchantStringId: id },
    { recordType: 'merchant_string', recordId: id, previousValue: { cafe_id: existing.cafe_id }, newValue: { cafe_id: cafeId } },
  );

  revalidatePath('/admin/merchant-strings');
}

export async function deleteMerchantString(id: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from('merchant_strings').select('raw_string').eq('id', id).maybeSingle();
  const { error } = await supabase.from('merchant_strings').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'merchant_string.delete',
    `Deleted merchant string "${existing?.raw_string ?? id}"`,
    { merchantStringId: id },
    { recordType: 'merchant_string', recordId: id, previousValue: existing ? { raw_string: existing.raw_string } : null, newValue: null },
  );

  revalidatePath('/admin/merchant-strings');
}

// §10 reimbursement records — the amount owed is already derivable from
// rewards(status='redeemed') joined to reward_items.reimbursement_cents;
// this just records that a given redemption has been paid out.
export async function markReimbursementPaid(rewardId: string) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from('reimbursement_payments').upsert({ reward_id: rewardId, admin_email: admin.email ?? 'unknown' }, { onConflict: 'reward_id' });
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'reimbursement.mark_paid',
    `Marked reward ${rewardId} reimbursed`,
    { rewardId },
    { recordType: 'reward', recordId: rewardId, previousValue: { paid: false }, newValue: { paid: true } },
  );
  await trackServerEvent('reimbursement_marked_paid', null, { rewardId });

  revalidatePath('/admin/reimbursements');
}

// §11 feature flags — this is the only writer; every real gate reads
// through lib/server/featureFlags.ts's isFeatureEnabled(), which queries
// this same table, so a toggle here takes effect on the very next request.
export async function setFeatureFlag(key: FeatureFlagKey, enabled: boolean) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();

  const { data: existing } = await supabase.from('feature_flags').select('enabled').eq('key', key).maybeSingle();

  const { error } = await supabase.from('feature_flags').update({ enabled, updated_at: new Date().toISOString(), updated_by: admin.email ?? 'unknown' }).eq('key', key);
  if (error) throw new Error(error.message);

  await logAdminAction(
    admin.email ?? 'unknown',
    'feature_flag.toggle',
    `${enabled ? 'Enabled' : 'Disabled'} feature flag "${key}"`,
    { key, enabled },
    { recordType: 'feature_flag', recordId: key, previousValue: { enabled: existing?.enabled ?? null }, newValue: { enabled } },
  );

  revalidatePath('/admin/flags');
}
