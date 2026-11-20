'use client';

import { CITIES, CITY_LABELS, describeVector } from '@/lib/data/cafeFields';
import { useCity } from '@/components/CityProvider';
import type { TasteVector } from '@/lib/matching';

interface ProfilePanelProps {
  email: string;
  /** ISO timestamp of when the account was created. */
  memberSince: string | null;
  taste: TasteVector | null;
  stamps: number;
  stampsRequired: number;
  savedCount: number;
  visitCount: number;
  onEditTaste: () => void;
  onSignOut: () => void;
}

function formatMonth(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
}

// The signed-in visitor's own page: who they are, where they are, what their
// taste says, and how close the City Card is. Everything here is read from
// what the dashboard already has — no new tables — and the two things a
// person can change (city, taste) are editable in place.
export function ProfilePanel({
  email,
  memberSince,
  taste,
  stamps,
  stampsRequired,
  savedCount,
  visitCount,
  onEditTaste,
  onSignOut,
}: ProfilePanelProps) {
  const { city, setCity } = useCity();
  const since = formatMonth(memberSince);
  const traits = taste ? describeVector({ ...taste }, 3) : [];
  const remaining = Math.max(0, stampsRequired - stamps);

  return (
    <div className="profile-grid">
      <div className="profile-card profile-id">
        <div className="profile-avatar" aria-hidden="true">
          {email.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="profile-email">{email}</div>
          {since ? <div className="profile-sub">Member since {since}</div> : null}
        </div>
      </div>

      <div className="profile-card">
        <h3>Your city</h3>
        <p className="profile-sub">Cafés, matches and Today&apos;s Pick are scoped to it.</p>
        <div className="city-switch" role="group" aria-label="Your city">
          {CITIES.map((c) => (
            <button key={c} type="button" aria-pressed={city === c} onClick={() => setCity(c)}>
              {CITY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-card">
        <h3>Your taste</h3>
        {traits.length > 0 ? (
          <ul className="profile-traits">
            {traits.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : (
          <p className="profile-sub">Not set yet — take the quiz or set it by hand.</p>
        )}
        <button type="button" className="btn btn-ghost profile-btn" onClick={onEditTaste}>
          {traits.length > 0 ? 'Edit your taste' : 'Set your taste'}
        </button>
      </div>

      <div className="profile-card">
        <h3>Your City Card</h3>
        <div className="profile-progress" role="img" aria-label={`${stamps} of ${stampsRequired} visits`}>
          {Array.from({ length: stampsRequired }, (_, i) => (
            <span key={i} data-on={i < stamps} />
          ))}
        </div>
        <p className="profile-sub">
          {remaining === 0
            ? 'Card complete — your free item is ready.'
            : `${stamps} of ${stampsRequired} visits. ${remaining} more and the next one is free.`}
        </p>
      </div>

      <div className="profile-card profile-stats">
        <div>
          <strong>{savedCount}</strong>
          <span>on your City List</span>
        </div>
        <div>
          <strong>{visitCount}</strong>
          <span>visits logged</span>
        </div>
      </div>

      <div className="profile-card profile-account">
        <h3>Account</h3>
        <p className="profile-sub">Need something changed or removed? Email hello@brewandthecity.com.</p>
        <button type="button" className="btn btn-ghost profile-btn" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
