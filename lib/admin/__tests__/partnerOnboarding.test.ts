import { describe, expect, it } from 'vitest';
import {
  cafeFieldsFromApplication,
  generatePortalCredential,
  nextOnboardingStatusAfterLogin,
  planApplicationApproval,
  resolveSlugCollision,
  shouldCreateCafeForApplication,
  slugify,
  type PartnerApplicationLike,
} from '../partnerOnboarding';

function pendingApplication(overrides: Partial<PartnerApplicationLike> = {}): PartnerApplicationLike {
  return {
    status: 'pending',
    cafe_name: 'Sunset Coffee',
    email: 'owner@sunsetcoffee.example',
    neighbourhood: 'Mission',
    instagram: '@sunsetcoffee',
    ...overrides,
  };
}

describe('slugify', () => {
  it('lowercases, replaces non-alphanumerics with hyphens, and trims edge hyphens', () => {
    expect(slugify('Sunset Coffee')).toBe('sunset-coffee');
    expect(slugify("Analog Coffee & Tea!")).toBe('analog-coffee-tea');
    expect(slugify('  Café Étoile  ')).toBe('caf-toile');
  });
});

describe('resolveSlugCollision', () => {
  it('returns the base slug unchanged when nothing collides', () => {
    expect(resolveSlugCollision('sunset-coffee', new Set())).toBe('sunset-coffee');
  });

  it('appends -2 when the base slug is taken', () => {
    expect(resolveSlugCollision('sunset-coffee', new Set(['sunset-coffee']))).toBe('sunset-coffee-2');
  });

  it('keeps incrementing past multiple existing suffixes', () => {
    const existing = new Set(['sunset-coffee', 'sunset-coffee-2', 'sunset-coffee-3']);
    expect(resolveSlugCollision('sunset-coffee', existing)).toBe('sunset-coffee-4');
  });
});

describe('generatePortalCredential', () => {
  it('generates a 6-character credential from the unambiguous alphabet only', () => {
    const credential = generatePortalCredential();
    expect(credential).toHaveLength(6);
    expect(credential).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('never contains 0, O, 1, or I — the characters the alphabet deliberately excludes', () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePortalCredential()).not.toMatch(/[0O1I]/);
    }
  });

  it('is effectively unique across many calls', () => {
    const seen = new Set(Array.from({ length: 500 }, () => generatePortalCredential()));
    expect(seen.size).toBe(500);
  });

  it('accepts an injected random source for deterministic testing', () => {
    const fixedBytes = Buffer.from([0, 1, 2, 3, 4, 5]);
    const credential = generatePortalCredential(() => fixedBytes);
    expect(credential).toBe('ABCDEF');
  });
});

describe('cafeFieldsFromApplication', () => {
  it('maps application fields onto café fields, always as a "listed" tier — never auto-granting Founding Partner', () => {
    const fields = cafeFieldsFromApplication(pendingApplication(), 'sunset-coffee', 'ABC123');
    expect(fields).toEqual({
      name: 'Sunset Coffee',
      slug: 'sunset-coffee',
      neighbourhood: 'Mission',
      contact_email: 'owner@sunsetcoffee.example',
      instagram_handle: '@sunsetcoffee',
      partner_status: 'listed',
      onboarding_status: 'pending_portal_setup',
      portal_pin: 'ABC123',
    });
  });

  it('carries a null instagram through as null rather than inventing a value', () => {
    const fields = cafeFieldsFromApplication(pendingApplication({ instagram: null }), 'sunset-coffee', 'ABC123');
    expect(fields.instagram_handle).toBeNull();
  });

  it('trims the café name', () => {
    const fields = cafeFieldsFromApplication(pendingApplication({ cafe_name: '  Sunset Coffee  ' }), 'sunset-coffee', 'ABC123');
    expect(fields.name).toBe('Sunset Coffee');
  });
});

describe('shouldCreateCafeForApplication', () => {
  it('is true only for a pending application', () => {
    expect(shouldCreateCafeForApplication('pending')).toBe(true);
    expect(shouldCreateCafeForApplication('approved')).toBe(false);
    expect(shouldCreateCafeForApplication('rejected')).toBe(false);
  });
});

describe('planApplicationApproval', () => {
  it('approving a pending application creates exactly one café, with a fresh slug', () => {
    const plan = planApplicationApproval(pendingApplication(), new Set(), 'ABC123');
    expect(plan.action).toBe('create');
    if (plan.action === 'create') {
      expect(plan.slug).toBe('sunset-coffee');
      expect(plan.cafeFields.name).toBe('Sunset Coffee');
      expect(plan.cafeFields.portal_pin).toBe('ABC123');
    }
  });

  it('duplicate approval (application already approved) does not create a second café', () => {
    const plan = planApplicationApproval(pendingApplication({ status: 'approved' }), new Set(), 'ABC123');
    expect(plan).toEqual({ action: 'skip' });
  });

  it('a rejected application is also skipped, not (re-)created', () => {
    const plan = planApplicationApproval(pendingApplication({ status: 'rejected' }), new Set(), 'ABC123');
    expect(plan).toEqual({ action: 'skip' });
  });

  it('resolves a slug collision against an existing café of the same name', () => {
    const plan = planApplicationApproval(pendingApplication(), new Set(['sunset-coffee']), 'ABC123');
    expect(plan.action).toBe('create');
    if (plan.action === 'create') {
      expect(plan.slug).toBe('sunset-coffee-2');
      expect(plan.cafeFields.slug).toBe('sunset-coffee-2');
    }
  });
});

describe('nextOnboardingStatusAfterLogin', () => {
  it('flips pending_portal_setup to active on first login', () => {
    expect(nextOnboardingStatusAfterLogin('pending_portal_setup')).toBe('active');
  });

  it('stays active on every subsequent login — idempotent', () => {
    expect(nextOnboardingStatusAfterLogin('active')).toBe('active');
  });
});
