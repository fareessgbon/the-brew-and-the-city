'use client';

import { DIMS, LABELS, PRIMARY_DRINK_CATEGORIES, PRIMARY_DRINK_CATEGORY_LABELS } from '@/lib/matching';
import { foundingPartnerStatusLine } from '@/lib/partners';
import type { Database } from '@/lib/supabase/types';

type Cafe = Database['public']['Tables']['cafes']['Row'];
type CafeAttributes = Database['public']['Tables']['cafe_attributes']['Row'];

const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
] as const;

const SCORE_FIELD: Record<(typeof DIMS)[number], keyof Cafe> = {
  drink: 'drink_score',
  energy: 'energy_score',
  aesthetic: 'aesthetic_score',
  pace: 'pace_score',
  adventure: 'adventure_score',
  price: 'price_score',
  food: 'food_score',
};

export function CafeForm({
  cafe,
  attributes,
  action,
  submitLabel,
}: {
  cafe?: Cafe;
  attributes?: CafeAttributes;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const hours = (cafe?.opening_hours ?? {}) as Record<string, [string, string]>;
  // New cafés default to serving everything — narrowing it is a deliberate
  // admin edit, not something a blank form should force (§7.2).
  const drinkCategories = cafe ? cafe.drink_categories : PRIMARY_DRINK_CATEGORIES;
  const photos = cafe?.photos ?? [];

  return (
    <form action={action} className="cafe-signup-form" style={{ maxWidth: 720 }}>
      <div className="field-row">
        <div>
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" defaultValue={cafe?.name} required />
        </div>
        <div>
          <label htmlFor="slug">Slug</label>
          <input type="text" id="slug" name="slug" defaultValue={cafe?.slug} required />
        </div>
      </div>

      <div className="field-row">
        <div>
          <label htmlFor="neighbourhood">Neighbourhood</label>
          <input type="text" id="neighbourhood" name="neighbourhood" defaultValue={cafe?.neighbourhood ?? ''} />
        </div>
        <div>
          <label htmlFor="partner_status">Partner status</label>
          <select id="partner_status" name="partner_status" defaultValue={cafe?.partner_status ?? 'listed'}>
            <option value="listed">Listed</option>
            <option value="partner">Partner</option>
            <option value="featured">Featured</option>
            <option value="founding_partner">Founding Partner (max 15, max 6 months free)</option>
          </select>
          {cafe?.partner_status === 'founding_partner' && cafe.founding_partner_started_at ? (
            <div style={{ fontSize: 12, color: 'var(--whisk)', marginTop: 6 }}>{foundingPartnerStatusLine(cafe.founding_partner_started_at)}</div>
          ) : null}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="address">Address</label>
        <input type="text" id="address" name="address" defaultValue={cafe?.address ?? ''} />
        <div style={{ fontSize: 11.5, color: 'var(--whisk)', marginTop: 4 }}>
          Coordinates are looked up from this automatically when it changes — no need to enter them by hand.
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Status
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
          <input type="checkbox" name="is_active" value="true" defaultChecked={cafe?.is_active ?? true} style={{ width: 'auto' }} />
          Active — deactivating hides this café from every recommendation surface without deleting it
        </label>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Contact &amp; social
      </div>
      <div className="field-row" style={{ marginBottom: 4 }}>
        <div>
          <label htmlFor="contact_phone">Phone</label>
          <input type="text" id="contact_phone" name="contact_phone" defaultValue={cafe?.contact_phone ?? ''} />
        </div>
        <div>
          <label htmlFor="contact_email">Contact email</label>
          <input type="email" id="contact_email" name="contact_email" defaultValue={cafe?.contact_email ?? ''} />
        </div>
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div>
          <label htmlFor="instagram_handle">Instagram handle</label>
          <input type="text" id="instagram_handle" name="instagram_handle" placeholder="@yourcafe" defaultValue={cafe?.instagram_handle ?? ''} />
        </div>
        <div>
          <label htmlFor="website_url">Website</label>
          <input type="text" id="website_url" name="website_url" placeholder="https://…" defaultValue={cafe?.website_url ?? ''} />
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Price band
      </div>
      <div className="ratio-box" style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        {(['$', '$$', '$$$'] as const).map((band) => (
          <label key={band} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, textTransform: 'none' }}>
            <input type="radio" name="price_band" value={band} defaultChecked={cafe?.price_band === band} style={{ width: 'auto' }} />
            {band}
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, textTransform: 'none' }}>
          <input type="radio" name="price_band" value="" defaultChecked={!cafe?.price_band} style={{ width: 'auto' }} />
          Not set
        </label>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Photos
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        {photos.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {photos.map((url) => (
              <div key={url} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only tool, arbitrary external URLs */}
                <img src={url} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginTop: 4, textTransform: 'none' }}>
                  <input type="checkbox" name="remove_photos" value={url} style={{ width: 'auto' }} />
                  Remove
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--whisk)', marginTop: 0 }}>No photos yet.</p>
        )}
        <label htmlFor="new_photos" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
          Add photos
        </label>
        <input type="file" id="new_photos" name="new_photos" accept="image/jpeg,image/png,image/webp" multiple />
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Taste vector (0–100)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        {DIMS.map((dim) => {
          const value = cafe ? (cafe[SCORE_FIELD[dim]] as number) : 50;
          return (
            <div key={dim}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{dim}</span>
                <span id={`${dim}-value`} style={{ color: 'var(--whisk)' }}>
                  {value}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                id={dim}
                name={dim}
                defaultValue={value}
                style={{ width: '100%' }}
                onChange={(e) => {
                  const out = document.getElementById(`${dim}-value`);
                  if (out) out.textContent = e.currentTarget.value;
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--whisk)' }}>
                <span>0 — {LABELS[dim].low}</span>
                <span>100 — {LABELS[dim].high}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Drink categories served (§7.2 — hard filter on the quiz&apos;s Q1)
      </div>
      <div className="ratio-box" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {PRIMARY_DRINK_CATEGORIES.map((category) => (
          <label key={category} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="drink_categories" value={category} defaultChecked={drinkCategories.includes(category)} style={{ width: 'auto' }} />
            {PRIMARY_DRINK_CATEGORY_LABELS[category]}
          </label>
        ))}
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Opening hours
      </div>
      <div style={{ marginBottom: 16 }}>
        {DAYS.map(([key, label]) => (
          <div key={key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13.5 }}>{label}</span>
            <input type="time" name={`hours_${key}_open`} defaultValue={hours[key]?.[0] ?? ''} />
            <input type="time" name={`hours_${key}_close`} defaultValue={hours[key]?.[1] ?? ''} />
          </div>
        ))}
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Dietary &amp; accessibility (§7.2 hard filters — leave unchecked until confirmed on-site)
      </div>
      <div className="ratio-box" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
          <input type="checkbox" name="oat" value="true" defaultChecked={attributes?.oat ?? false} style={{ width: 'auto' }} />
          Non-dairy / oat milk available
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
          <input type="checkbox" name="gluten_free" value="true" defaultChecked={attributes?.gluten_free ?? false} style={{ width: 'auto' }} />
          Gluten-free options
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
          <input type="checkbox" name="wheelchair" value="true" defaultChecked={attributes?.wheelchair ?? false} style={{ width: 'auto' }} />
          Step-free / wheelchair access
        </label>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Amenities
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="wifi" value="true" defaultChecked={attributes?.wifi ?? false} style={{ width: 'auto' }} />
            Wi-Fi
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="outlets" value="true" defaultChecked={attributes?.outlets ?? false} style={{ width: 'auto' }} />
            Outlets
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="outdoor_seating" value="true" defaultChecked={attributes?.outdoor_seating ?? false} style={{ width: 'auto' }} />
            Outdoor seating
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="food_program" value="true" defaultChecked={attributes?.food_program ?? false} style={{ width: 'auto' }} />
            Food program
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="cash_accepted" value="true" defaultChecked={attributes?.cash_accepted ?? true} style={{ width: 'auto' }} />
            Cash accepted
          </label>
        </div>
        <div className="field-row" style={{ marginBottom: 4 }}>
          <div>
            <label htmlFor="seating_notes">Seating notes</label>
            <input type="text" id="seating_notes" name="seating_notes" placeholder="e.g. counter + 4 tables" defaultValue={attributes?.seating_notes ?? ''} />
          </div>
          <div>
            <label htmlFor="noise_level">Noise level</label>
            <select id="noise_level" name="noise_level" defaultValue={attributes?.noise_level ?? ''}>
              <option value="">Not set</option>
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="loud">Loud</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="average_wait_minutes">Average wait (minutes)</label>
          <input
            type="number"
            min={0}
            id="average_wait_minutes"
            name="average_wait_minutes"
            style={{ maxWidth: 160 }}
            defaultValue={attributes?.average_wait_minutes ?? ''}
          />
        </div>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Recommendation readiness
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 10, textTransform: 'none' }}>
          <input type="checkbox" name="verified" value="true" defaultChecked={!!cafe?.verified_at} style={{ width: 'auto' }} />
          Verified in person — vector confirmed on-site, not guessed
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
          <input type="checkbox" name="is_match_ready" value="true" defaultChecked={cafe?.is_match_ready ?? false} style={{ width: 'auto' }} />
          Match-ready — eligible for /today, /discover, and /map (also needs coordinates, address, neighbourhood, and hours above)
        </label>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        City Card portal
      </div>
      <div className="ratio-box" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="stamps_enabled" value="true" defaultChecked={cafe?.stamps_enabled ?? true} style={{ width: 'auto' }} />
            Stamps enabled — receipts here can earn a City Card visit
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="rewards_enabled" value="true" defaultChecked={cafe?.rewards_enabled ?? true} style={{ width: 'auto' }} />
            Rewards enabled — members can redeem here (pause without disabling stamps)
          </label>
        </div>
        <label htmlFor="portal_pin" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)', marginBottom: 6 }}>
          Portal PIN
        </label>
        <input
          type="text"
          id="portal_pin"
          name="portal_pin"
          defaultValue={cafe?.portal_pin ?? ''}
          placeholder="e.g. 4271"
          style={{ width: '100%', maxWidth: 200, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--whisk-10)', fontFamily: 'var(--font-mono)' }}
        />
        <div style={{ fontSize: 12, color: 'var(--whisk)', marginTop: 8 }}>
          Café staff enter this (no account) at /portal/{cafe?.slug ?? '[slug]'} to review receipts and redeem
          rewards. Leave blank until the café is onboarded.
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
