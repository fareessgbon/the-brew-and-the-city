// Pure logic behind "approve a partner application" — split out of
// app/admin/actions.ts, same reasoning as csvImport.ts/rewardItems.ts/
// deletionGuards.ts: unit-testable without a Supabase/Next.js runtime. The
// action itself does the actual DB reads/writes and calls into this module
// to decide what those writes should be.

import { randomBytes } from 'node:crypto';
import type { OnboardingStatus, PartnerStatus } from '@/lib/supabase/types';

// Same rule cafeFieldsFromForm uses for an admin-typed slug — applied here
// to a café name an applicant typed, which never had a slug to begin with.
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Two different applicants can name their café the same thing ("Sunset
// Coffee"); this picks the next free slug (-2, -3, ...) rather than letting
// a unique-constraint violation surface as a raw DB error. Pure — the
// caller supplies which slugs already exist (or collide), this just picks.
export function resolveSlugCollision(baseSlug: string, existingSlugs: ReadonlySet<string>): string {
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let n = 2;
  while (existingSlugs.has(`${baseSlug}-${n}`)) n++;
  return `${baseSlug}-${n}`;
}

// Unambiguous alphabet (no 0/O/1/I) — same one lib/server/sixthRound.ts
// uses for reward activation codes, read aloud/typed by café staff. 6
// characters (33^6 ≈ 1.29 billion combinations) rather than the 4-digit
// PINs an admin sets by hand elsewhere — this one's machine-generated, so
// there's no reason to keep it short.
const CREDENTIAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CREDENTIAL_LENGTH = 6;

// randomBytesFn is injectable so tests can assert format/uniqueness without
// depending on real entropy timing — vitest's own `expect` calls are the
// consumer, not a mock, for the default path.
export function generatePortalCredential(randomBytesFn: (n: number) => Buffer = randomBytes): string {
  const bytes = randomBytesFn(CREDENTIAL_LENGTH);
  return Array.from(bytes, (b) => CREDENTIAL_ALPHABET[b % CREDENTIAL_ALPHABET.length]).join('');
}

export interface CafeFieldsFromApplication {
  name: string;
  slug: string;
  neighbourhood: string;
  contact_email: string;
  instagram_handle: string | null;
  partner_status: PartnerStatus;
  onboarding_status: OnboardingStatus;
  portal_pin: string;
}

export interface PartnerApplicationLike {
  status: string;
  cafe_name: string;
  email: string;
  neighbourhood: string;
  instagram: string | null;
}

export function cafeFieldsFromApplication(application: PartnerApplicationLike, slug: string, portalCredential: string): CafeFieldsFromApplication {
  return {
    name: application.cafe_name.trim(),
    slug,
    neighbourhood: application.neighbourhood,
    contact_email: application.email,
    instagram_handle: application.instagram,
    // Always 'listed' — never auto-grants Founding Partner status, even
    // though these are labeled Founding Partner applications. That tier is
    // capped at 15 (assertTierCapacity in actions.ts); an admin promotes
    // the café manually from the café-edit page, where the cap check
    // already lives and is already exercised.
    partner_status: 'listed',
    onboarding_status: 'pending_portal_setup',
    portal_pin: portalCredential,
  };
}

// Whether approving this application should create a café at all — false
// for one that isn't pending (already approved/rejected, or a second
// concurrent approval click). The action also enforces this atomically at
// the DB level (`.eq('status', 'pending')` on the update), which is the
// real race-safety guarantee; this is the same decision made explicit and
// testable in isolation.
export function shouldCreateCafeForApplication(applicationStatus: string): boolean {
  return applicationStatus === 'pending';
}

export type ApplicationApprovalPlan =
  | { action: 'skip' }
  | { action: 'create'; slug: string; cafeFields: CafeFieldsFromApplication };

// The full decision, composed: given an application, the slugs it might
// collide with, and a freshly-generated credential, what should approving
// it actually do? Executing this plan is the action's job (actions.ts);
// deciding what the plan is is this function's.
export function planApplicationApproval(
  application: PartnerApplicationLike,
  existingSlugs: ReadonlySet<string>,
  portalCredential: string,
): ApplicationApprovalPlan {
  if (!shouldCreateCafeForApplication(application.status)) {
    return { action: 'skip' };
  }
  const slug = resolveSlugCollision(slugify(application.cafe_name), existingSlugs);
  return { action: 'create', slug, cafeFields: cafeFieldsFromApplication(application, slug, portalCredential) };
}

// A café's very first successful portal login is the practical signal that
// setup actually happened (PIN was received and used) — flips the status
// once, then stays 'active' on every login after. Idempotent: calling this
// on an already-active café just returns 'active' again, so the caller
// doesn't need to branch before deciding whether to write.
export function nextOnboardingStatusAfterLogin(current: OnboardingStatus): OnboardingStatus {
  return current === 'pending_portal_setup' ? 'active' : current;
}
