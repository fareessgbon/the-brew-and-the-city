'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  CITIES,
  CITY_LABELS,
  DAYS,
  DAY_LABELS,
  describeVector,
  DIMS,
  DIM_QUESTIONS,
  EMPTY_CAFE,
  LABELS,
  NEIGHBOURHOOD_SUGGESTIONS_BY_CITY,
  PARTNER_STATUSES,
  PARTNER_STATUS_LABELS,
  PRICE_BANDS,
  PRIMARY_DRINK_CATEGORIES,
  PRIMARY_DRINK_CATEGORY_LABELS,
  slugify,
  type CafeEditorValues,
  type City,
  type Day,
  type Dim,
  type OpeningHours,
  type PartnerStatus,
} from '@/lib/data/cafeFields';

// Re-exported so existing `import { CafeEditorForm, EMPTY_CAFE, type
// CafeEditorValues } from '@/components/CafeEditorForm'` call sites keep
// working — but new code should prefer importing these two directly from
// lib/data/cafeFields, since that's a plain module and this one is
// 'use client'. Passing EMPTY_CAFE through as a prop the way this file
// does is fine; a Server Component spreading it (`{...EMPTY_CAFE}`) is
// not — see the comment on its real definition for why.
export { EMPTY_CAFE };
export type { CafeEditorValues };

// A candidate for "you might be re-creating this one" — just enough of an
// existing row to link to it and compare names/slugs against.
export interface CafeDuplicateCandidate {
  id: string;
  name: string;
  slug: string;
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cafe-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="cafe-field-hint">{hint}</p> : null}
    </div>
  );
}

// Native tick marks at every quarter, shared by every slider via `list=` —
// a zero-CSS way to give the track a felt sense of scale instead of a bare
// line between two words.
function DimScale() {
  return (
    <datalist id="cafe-dim-scale">
      <option value="0" />
      <option value="25" />
      <option value="50" />
      <option value="75" />
      <option value="100" />
    </datalist>
  );
}

// The dim slider, paired with a real number input rather than a read-only
// value — dragging is how you feel your way to a score, typing "72" is how
// you set one precisely once you know it. Both ends of the scale stay on
// screen, because a bare number means nothing without the two poles it
// sits between (same words the quiz shows a visitor — LABELS).
function DimSlider({
  dim,
  value,
  onChange,
  id,
}: {
  dim: Dim;
  value: number;
  onChange: (next: number) => void;
  id: string;
}) {
  const { low, high } = LABELS[dim];
  return (
    <div className="cafe-dim">
      <div className="cafe-dim-head">
        <label htmlFor={id} className="cafe-dim-name">
          {dim}
        </label>
        <span className="cafe-dim-question">{DIM_QUESTIONS[dim]}</span>
        <input
          type="number"
          className="cafe-dim-number"
          data-neutral={value === 50}
          min={0}
          max={100}
          value={value}
          aria-label={`${dim} score, 0 to 100, exact value`}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.max(0, Math.min(100, Math.round(n))));
          }}
        />
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        list="cafe-dim-scale"
        aria-label={`${dim}: 0 is ${low}, 100 is ${high}, currently ${value}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="cafe-dim-poles" aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function isUniformHours(hours: OpeningHours): boolean {
  const pairs = DAYS.map((d) => hours[d]);
  if (pairs.some((p) => !p)) return false;
  const [open0, close0] = pairs[0] as [string, string];
  return pairs.every((p) => p![0] === open0 && p![1] === close0);
}

export function CafeEditorForm({
  initial,
  cafeId,
  existingCafes = [],
}: {
  initial: CafeEditorValues;
  cafeId?: string;
  // Other active cafés (never including this one), for the duplicate
  // warning below. Only worth passing on /admin/cafes/new and .../[id] —
  // absence just means the warning never fires, not a broken form.
  existingCafes?: CafeDuplicateCandidate[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<CafeEditorValues>(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  // True once anything has actually changed — gates the beforeunload
  // warning and the guarded back-link below, so leaving a freshly-opened,
  // untouched form never prompts for anything.
  const [dirty, setDirty] = useState(false);
  const [uniformHours, setUniformHours] = useState(() => isUniformHours(initial.opening_hours));
  // Two deliberate clicks, matching AdminDeleteButton — a native confirm()
  // is exactly the kind of dialog a hand clicks through on autopilot.
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  // The slug follows the name only until someone types in the slug field.
  // After that it's theirs — a saved café's slug is its identity, and
  // fixing a typo in the name shouldn't silently move it.
  const slugTouched = useRef(Boolean(initial.slug));

  const isNew = !cafeId;

  // Tab close, refresh, or typing a new address — the one class of "leave"
  // an in-app Link can't cover, because Next's client-side navigation
  // never fires beforeunload at all.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function set<K extends keyof CafeEditorValues>(key: K, value: CafeEditorValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setState('idle');
    setDirty(true);
  }

  function setHours(day: Day, index: 0 | 1, time: string) {
    setValues((v) => {
      const existing = v.opening_hours[day] ?? ['09:00', '17:00'];
      const next: [string, string] = index === 0 ? [time, existing[1]] : [existing[0], time];
      return { ...v, opening_hours: { ...v.opening_hours, [day]: next } };
    });
    setState('idle');
    setDirty(true);
  }

  function toggleDay(day: Day, open: boolean) {
    setValues((v) => {
      const next = { ...v.opening_hours };
      if (open) next[day] = next[day] ?? ['08:00', '17:00'];
      else delete next[day];
      return { ...v, opening_hours: next };
    });
    setState('idle');
    setDirty(true);
  }

  function applyUniformHours(pair: [string, string]) {
    setValues((v) => ({ ...v, opening_hours: DAYS.reduce((acc, d) => ({ ...acc, [d]: pair }), {} as OpeningHours) }));
    setState('idle');
    setDirty(true);
  }

  function toggleUniform(next: boolean) {
    setUniformHours(next);
    if (next) {
      const firstDefined = DAYS.map((d) => values.opening_hours[d]).find((p): p is [string, string] => Boolean(p));
      applyUniformHours(firstDefined ?? ['08:00', '17:00']);
    }
  }

  function copyMondayToWeekdays() {
    const mon = values.opening_hours.mon;
    if (!mon) return;
    setValues((v) => ({ ...v, opening_hours: { ...v.opening_hours, tue: mon, wed: mon, thu: mon, fri: mon } }));
    setState('idle');
    setDirty(true);
  }

  function payload() {
    return {
      name: values.name,
      slug: values.slug || slugify(values.name),
      city: values.city,
      neighbourhood: values.neighbourhood,
      address: values.address,
      latitude: values.latitude,
      longitude: values.longitude,
      website_url: values.website_url,
      instagram_handle: values.instagram_handle,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone,
      price_band: values.price_band,
      drink_categories: values.drink_categories,
      opening_hours: values.opening_hours,
      partner_status: values.partner_status,
      verified: values.verified,
      ...DIMS.reduce((acc, d) => ({ ...acc, [`${d}_score`]: values.scores[d] }), {}),
    };
  }

  // `again` is the bulk-entry path: save this café and hand back an empty
  // form with the cursor in the name field, so a stack of cafés goes in
  // without a round trip through the list page between each one.
  async function save(again = false) {
    setState('saving');
    setError(null);
    try {
      const res = await fetch(isNew ? '/api/admin/cafes' : `/api/admin/cafes/${cafeId}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Something went wrong.');
        setState('idle');
        return;
      }
      if (isNew && again) {
        setValues(EMPTY_CAFE);
        slugTouched.current = false;
        setUniformHours(false);
        setDirty(false);
        setState('saved');
        nameRef.current?.focus();
        router.refresh();
        return;
      }
      setDirty(false);
      setState('saved');
      router.push('/admin/cafes');
      router.refresh();
    } catch {
      setError('Couldn’t reach the server. Check your connection and try again.');
      setState('idle');
    }
  }

  async function archive() {
    if (!cafeId) return;
    setState('saving');
    setError(null);
    try {
      const res = await fetch(`/api/admin/cafes/${cafeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDirty(false);
      router.push('/admin/cafes');
      router.refresh();
    } catch {
      setError('Couldn’t archive that café.');
      setState('idle');
    }
  }

  // Cmd/Ctrl+S saves without reaching for the mouse — this form is meant to
  // be filled in a dozen times in a sitting.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const canSave = values.name.trim().length > 0 && state !== 'saving';

  // Warn on an exact name, an exact slug, or one name containing the other
  // (typing "Rosso" should surface "Rosso Coffee Roasters") — but only once
  // there's enough typed that a short common word can't false-positive.
  const typedName = values.name.trim().toLowerCase();
  const typedSlug = values.slug || slugify(values.name);
  const duplicateMatch = typedName
    ? (existingCafes.find((c) => {
        if (c.id === cafeId) return false;
        if (c.slug === typedSlug) return true;
        const existing = c.name.trim().toLowerCase();
        if (existing === typedName) return true;
        return typedName.length >= 3 && (existing.includes(typedName) || typedName.includes(existing));
      }) ?? null)
    : null;

  const vectorDescription = describeVector(values.scores);

  return (
    <div className="cafe-editor-layout">
      <form
        className="cafe-signup-form cafe-editor"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <section className="cafe-editor-block">
          <h2>The café</h2>
          <div className="field-row">
            <Field id="cafe-name" label="Name">
              <input
                id="cafe-name"
                ref={nameRef}
                value={values.name}
                autoFocus
                onChange={(e) => {
                  const name = e.target.value;
                  setValues((v) => ({
                    ...v,
                    name,
                    slug: slugTouched.current ? v.slug : slugify(name),
                  }));
                  setState('idle');
                  setDirty(true);
                }}
                placeholder="Monogram"
              />
            </Field>
            <Field id="cafe-slug" label="URL slug" hint="Lowercase, hyphenated. This is the café's permanent identity.">
              <input
                id="cafe-slug"
                value={values.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  set('slug', e.target.value);
                }}
                placeholder="monogram"
              />
            </Field>
          </div>

          {duplicateMatch ? (
            <div className="cafe-editor-warning" role="alert">
              <strong>{duplicateMatch.name}</strong> is already in the catalogue.{' '}
              <Link href={`/admin/cafes/${duplicateMatch.id}`}>Edit that café instead →</Link>
            </div>
          ) : null}

          <div className="field-row">
            <Field id="cafe-city" label="City" hint="Which market this café belongs to.">
              <select
                id="cafe-city"
                value={values.city}
                onChange={(e) => set('city', e.target.value as City)}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {CITY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="cafe-neighbourhood" label="Neighbourhood" hint="Printed on the match card, so it needs a real one.">
              <input
                id="cafe-neighbourhood"
                list="cafe-neighbourhoods"
                value={values.neighbourhood}
                onChange={(e) => set('neighbourhood', e.target.value)}
                placeholder={values.city === 'toronto' ? 'Ossington' : 'Mission'}
              />
              <datalist id="cafe-neighbourhoods">
                {NEIGHBOURHOOD_SUGGESTIONS_BY_CITY[values.city].map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
          </div>
          <div className="field-row">
            <Field id="cafe-address" label="Street address">
              <input
                id="cafe-address"
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder={values.city === 'toronto' ? '297 Harbord St, Toronto' : '2011 4 St SW, Calgary'}
              />
            </Field>
          </div>
          <div className="field-row">
            <Field id="cafe-lat" label="Latitude" hint="Right-click the pin in Google Maps to copy both.">
              <input
                id="cafe-lat"
                value={values.latitude}
                onChange={(e) => set('latitude', e.target.value)}
                inputMode="decimal"
                placeholder={values.city === 'toronto' ? '43.6532' : '51.0326'}
              />
            </Field>
            <Field id="cafe-lng" label="Longitude" hint="Without these, distance can't be scored at all.">
              <input
                id="cafe-lng"
                value={values.longitude}
                onChange={(e) => set('longitude', e.target.value)}
                inputMode="decimal"
                placeholder={values.city === 'toronto' ? '-79.3832' : '-114.0707'}
              />
            </Field>
          </div>
        </section>

        <section className="cafe-editor-block">
          <h2>Getting hold of them</h2>
          <div className="field-row">
            <Field id="cafe-website" label="Website">
              <input id="cafe-website" value={values.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://…" />
            </Field>
            <Field id="cafe-instagram" label="Instagram" hint="Handle only — the @ is added when it's shown.">
              <input
                id="cafe-instagram"
                value={values.instagram_handle}
                onChange={(e) => set('instagram_handle', e.target.value)}
                placeholder="monogramcoffee"
              />
            </Field>
          </div>
          <div className="field-row">
            <Field id="cafe-email" label="Contact email">
              <input id="cafe-email" value={values.contact_email} onChange={(e) => set('contact_email', e.target.value)} type="email" placeholder="hello@…" />
            </Field>
            <Field id="cafe-phone" label="Phone">
              <input id="cafe-phone" value={values.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="(403) …" />
            </Field>
          </div>
        </section>

        <section className="cafe-editor-block">
          <h2>What they serve</h2>
          <div className="field-row">
            <Field id="cafe-price-band" label="Price band">
              <select id="cafe-price-band" value={values.price_band} onChange={(e) => set('price_band', e.target.value)}>
                <option value="">Not set</option>
                {PRICE_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="cafe-partner-status" label="Partner status" hint="Visibility only — matching never reads this (§5.1).">
              <select id="cafe-partner-status" value={values.partner_status} onChange={(e) => set('partner_status', e.target.value)}>
                {PARTNER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PARTNER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {/* A checkbox group's real label is a <legend>, not a <label
              for> — nothing single-select for a <label> to point at here,
              unlike every other Field usage in this form. */}
          <fieldset className="cafe-field cafe-fieldset">
            <legend>Drink categories</legend>
            <div className="cafe-checks">
              {PRIMARY_DRINK_CATEGORIES.map((c) => (
                <label key={c} className="cafe-check">
                  <input
                    type="checkbox"
                    checked={values.drink_categories.includes(c)}
                    onChange={(e) =>
                      set(
                        'drink_categories',
                        e.target.checked
                          ? [...values.drink_categories, c]
                          : values.drink_categories.filter((x) => x !== c),
                      )
                    }
                  />
                  {PRIMARY_DRINK_CATEGORY_LABELS[c]}
                </label>
              ))}
            </div>
            <p className="cafe-field-hint">Untick anything they genuinely don&apos;t do — a matcha drinker shouldn&apos;t be sent somewhere without matcha.</p>
          </fieldset>
        </section>

        <section className="cafe-editor-block">
          <h2>The taste vector</h2>
          <p className="cafe-editor-note">
            Seven sliders, each 0–100. Anything left at 50 counts as “no read yet”, not as “middle of the
            road” — leave it there rather than guessing, and matching treats it as neutral.
          </p>
          <DimScale />
          {DIMS.map((dim) => (
            <DimSlider key={dim} dim={dim} id={`cafe-dim-${dim}`} value={values.scores[dim]} onChange={(n) => set('scores', { ...values.scores, [dim]: n })} />
          ))}
        </section>

        <section className="cafe-editor-block">
          <h2>Opening hours</h2>
          <label className="cafe-check" style={{ marginBottom: 10 }}>
            <input type="checkbox" checked={uniformHours} onChange={(e) => toggleUniform(e.target.checked)} />
            Same hours every day
          </label>

          {uniformHours ? (
            <div className="cafe-hours-row">
              <span className="cafe-hours-uniform-label">All 7 days</span>
              <div className="cafe-hours-times">
                <input
                  type="time"
                  value={values.opening_hours.mon?.[0] ?? '08:00'}
                  onChange={(e) => applyUniformHours([e.target.value, values.opening_hours.mon?.[1] ?? '17:00'])}
                  aria-label="Opens"
                />
                <span>to</span>
                <input
                  type="time"
                  value={values.opening_hours.mon?.[1] ?? '17:00'}
                  onChange={(e) => applyUniformHours([values.opening_hours.mon?.[0] ?? '08:00', e.target.value])}
                  aria-label="Closes"
                />
              </div>
            </div>
          ) : (
            <>
              <p className="cafe-editor-note" style={{ marginTop: -2 }}>A day left unticked is a day they&apos;re closed.</p>
              <div className="cafe-hours">
                {DAYS.map((day) => {
                  const hours = values.opening_hours[day];
                  return (
                    <div key={day} className="cafe-hours-row">
                      <label className="cafe-check">
                        <input type="checkbox" checked={Boolean(hours)} onChange={(e) => toggleDay(day, e.target.checked)} />
                        {DAY_LABELS[day]}
                      </label>
                      {hours ? (
                        <div className="cafe-hours-times">
                          <input type="time" value={hours[0]} onChange={(e) => setHours(day, 0, e.target.value)} aria-label={`${DAY_LABELS[day]} opens`} />
                          <span>to</span>
                          <input type="time" value={hours[1]} onChange={(e) => setHours(day, 1, e.target.value)} aria-label={`${DAY_LABELS[day]} closes`} />
                        </div>
                      ) : (
                        <span className="cafe-hours-closed">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="cafe-editor-link-btn"
                disabled={!values.opening_hours.mon}
                onClick={copyMondayToWeekdays}
                title={values.opening_hours.mon ? undefined : 'Set Monday’s hours first'}
              >
                Copy Monday’s hours to Tue–Fri
              </button>
            </>
          )}
        </section>

        <section className="cafe-editor-block">
          <h2>Verification</h2>
          <label className="cafe-check cafe-check-standalone">
            <input type="checkbox" checked={values.verified} onChange={(e) => set('verified', e.target.checked)} />
            I&apos;ve been to this café in person and these scores are from that visit
          </label>
          <p className="cafe-editor-note">
            The homepage keeps its “sample data” disclaimer up until every listed café has this ticked.
            Don&apos;t tick it for a café scored from photos and a menu.
          </p>
        </section>

        {error ? (
          <p className="cafe-editor-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="cafe-editor-actions">
          <button type="submit" className="btn btn-primary" disabled={!canSave}>
            {state === 'saving' ? 'Saving…' : isNew ? 'Save café' : 'Save changes'}
          </button>
          {isNew ? (
            <button type="button" className="btn btn-ghost" disabled={!canSave} onClick={() => void save(true)}>
              Save and add another
            </button>
          ) : confirmingArchive ? (
            <span className="cafe-editor-confirm">
              <span>Archive {values.name || 'this café'}? It stops appearing anywhere on the site.</span>
              <button type="button" onClick={() => void archive()} disabled={state === 'saving'}>
                Confirm
              </button>
              <button type="button" className="cafe-editor-cancel" onClick={() => setConfirmingArchive(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" className="cafe-editor-archive" onClick={() => setConfirmingArchive(true)} disabled={state === 'saving'}>
              Archive this café
            </button>
          )}
          <span className="cafe-editor-status">{state === 'saved' ? 'Saved' : ''}</span>
        </div>

        <div className="cafe-editor-back-row">
          {!dirty ? (
            <Link href="/admin/cafes" className="cafe-editor-back">
              ‹ Back to cafés
            </Link>
          ) : confirmingLeave ? (
            <span className="cafe-editor-confirm">
              <span>Discard unsaved changes?</span>
              <button type="button" onClick={() => router.push('/admin/cafes')}>
                Discard
              </button>
              <button type="button" className="cafe-editor-cancel" onClick={() => setConfirmingLeave(false)}>
                Keep editing
              </button>
            </span>
          ) : (
            <button type="button" className="cafe-editor-back" onClick={() => setConfirmingLeave(true)}>
              ‹ Back to cafés
            </button>
          )}
        </div>
      </form>

      <aside className="cafe-preview" aria-label="Live preview">
        <div className="cafe-preview-card">
          <div className="cafe-preview-label">Preview</div>
          <h3 className="cafe-preview-name">{values.name.trim() || 'Untitled café'}</h3>
          <div className="cafe-preview-meta">
            {[values.neighbourhood.trim() || 'No neighbourhood yet', values.price_band || null].filter(Boolean).join(' · ')}
          </div>
          <div className="cafe-preview-chips">
            {values.verified ? <span className="cafe-editor-chip cafe-editor-chip-verified">Verified</span> : <span className="cafe-editor-chip">Unverified</span>}
            <span className="cafe-editor-chip">{PARTNER_STATUS_LABELS[values.partner_status as PartnerStatus] ?? values.partner_status}</span>
          </div>
          <p className="cafe-preview-vector">
            {vectorDescription.length > 0 ? (
              <>Reads as {vectorDescription.join(', ')}.</>
            ) : (
              <span className="cafe-preview-muted">No taste read yet — every slider is still at neutral.</span>
            )}
          </p>
          {values.drink_categories.length > 0 && values.drink_categories.length < PRIMARY_DRINK_CATEGORIES.length ? (
            <div className="cafe-preview-chips">
              {values.drink_categories.map((c) => (
                <span key={c} className="cafe-editor-chip">
                  {PRIMARY_DRINK_CATEGORY_LABELS[c as keyof typeof PRIMARY_DRINK_CATEGORY_LABELS]}
                </span>
              ))}
            </div>
          ) : null}
          {values.website_url || values.instagram_handle ? (
            <div className="cafe-preview-links">
              {values.website_url ? <span>{values.website_url.replace(/^https?:\/\//, '')}</span> : null}
              {values.instagram_handle ? <span>@{values.instagram_handle.replace(/^@+/, '')}</span> : null}
            </div>
          ) : null}
        </div>
        <p className="cafe-preview-note">
          Roughly how {values.name.trim() || 'this café'} will read once saved — not a pixel-exact render of the
          homepage card.
        </p>
      </aside>
    </div>
  );
}
