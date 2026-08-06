import Link from 'next/link';
import { isOpenNow, type OpeningHours } from '@/lib/cafeHours';
import { SaveCafeButton } from './SaveCafeButton';
import { NotItButton } from './NotItButton';
import { TrackedDirectionsLink } from './TrackedDirectionsLink';

export interface CafeCardData {
  id: string;
  name: string;
  slug: string;
  neighbourhood: string | null;
  address?: string | null;
  openingHours?: OpeningHours | null;
  distanceKm?: number | null;
  pct?: number;
  reason?: string | null;
}

export function CafeCard({ cafe, saved, signedIn }: { cafe: CafeCardData; saved: boolean; signedIn: boolean }) {
  const open = isOpenNow(cafe.openingHours);
  const directionsQuery = encodeURIComponent(cafe.address || `${cafe.name}, Calgary, AB`);

  return (
    <div className="match-result">
      <div className="body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="name">
            <Link href={`/cafes/${cafe.slug}`}>{cafe.name}</Link>{' '}
            {cafe.neighbourhood ? <span style={{ fontWeight: 400, color: 'var(--whisk)', fontSize: 13 }}>— {cafe.neighbourhood}</span> : null}
          </span>
          {typeof cafe.pct === 'number' ? <span className="pct">{cafe.pct}% match</span> : null}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 4, fontSize: 12.5, color: 'var(--whisk)' }}>
          {open !== null ? <span>{open ? 'Open now' : 'Closed'}</span> : null}
          {typeof cafe.distanceKm === 'number' ? <span>{cafe.distanceKm.toFixed(1)} km</span> : null}
        </div>

        {cafe.reason ? <div className="why">{cafe.reason}</div> : null}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
          <SaveCafeButton cafeId={cafe.id} initiallySaved={saved} signedIn={signedIn} />
          <TrackedDirectionsLink
            cafeId={cafe.id}
            href={`https://www.google.com/maps/dir/?api=1&destination=${directionsQuery}`}
            className="btn btn-ghost"
            style={{ padding: '6px 14px', fontSize: 12.5 }}
          />
          <NotItButton cafeId={cafe.id} signedIn={signedIn} />
        </div>
      </div>
    </div>
  );
}
