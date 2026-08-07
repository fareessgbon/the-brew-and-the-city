'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface MapCafe {
  id: string;
  name: string;
  slug: string;
  neighbourhood: string | null;
  latitude: number | null;
  longitude: number | null;
  pct?: number;
}

interface CafeMapProps {
  cafes: MapCafe[];
  userLocation: { latitude: number; longitude: number } | null;
}

const CALGARY_CENTER: [number, number] = [-114.0719, 51.0447];
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Builds the popup via real DOM nodes (textContent, not innerHTML) so a café
// name or neighbourhood containing something like `<img onerror=...>` is
// rendered as inert text, never parsed as markup. setHTML()-with-template-
// string on database values is exactly the mistake this avoids.
function buildPopupContent(cafe: MapCafe): HTMLElement {
  const container = document.createElement('div');

  const name = document.createElement('strong');
  name.textContent = cafe.name;
  container.appendChild(name);
  container.appendChild(document.createElement('br'));

  const detailsParts = [cafe.neighbourhood, cafe.pct != null ? `${cafe.pct}% match` : null].filter(Boolean);
  if (detailsParts.length > 0) {
    const details = document.createElement('span');
    details.textContent = detailsParts.join(' · ');
    container.appendChild(details);
    container.appendChild(document.createElement('br'));
  }

  const link = document.createElement('a');
  link.href = `/cafes/${encodeURIComponent(cafe.slug)}`;
  link.style.color = '#2F4A33';
  link.textContent = 'View café →';
  container.appendChild(link);

  return container;
}

export function CafeMap({ cafes, userLocation }: CafeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const center: [number, number] = userLocation ? [userLocation.longitude, userLocation.latitude] : CALGARY_CENTER;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom: 12,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const bounds = new mapboxgl.LngLatBounds();

    if (userLocation) {
      new mapboxgl.Marker({ color: '#2F4A33' })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .setPopup(new mapboxgl.Popup().setText('You'))
        .addTo(map);
      bounds.extend([userLocation.longitude, userLocation.latitude]);
    }

    for (const cafe of cafes) {
      if (cafe.latitude == null || cafe.longitude == null) continue;
      new mapboxgl.Marker({ color: '#8FA96B' })
        .setLngLat([cafe.longitude, cafe.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setDOMContent(buildPopupContent(cafe)))
        .addTo(map);
      bounds.extend([cafe.longitude, cafe.latitude]);
    }

    // Frame whatever's actually on the map instead of always opening at a
    // fixed zoom — a single pin gets a sane close-up (maxZoom caps it from
    // zooming in absurdly tight), multiple pins all fit in view.
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [cafes, userLocation]);

  return (
    <>
      {TOKEN ? (
        <div
          ref={containerRef}
          style={{ width: '100%', height: 420, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--whisk-10)', marginBottom: 20 }}
        />
      ) : (
        <div className="notice-box" style={{ marginBottom: 20 }}>
          The interactive map isn&apos;t available right now — here&apos;s the full list instead.
        </div>
      )}

      {/* Text list kept alongside the map for accessibility — not everyone can use a drag-and-zoom canvas map — and
          shown even without a token, since it doesn't depend on Mapbox. */}
      <div>
        {cafes.map((cafe) => (
          <div className="cafe-chip" key={cafe.id} style={{ marginRight: 8, marginBottom: 8, display: 'inline-block' }}>
            <Link href={`/cafes/${cafe.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {cafe.name}
              {cafe.pct != null ? ` — ${cafe.pct}%` : ''}
              {cafe.latitude == null ? ' (no pin yet)' : ''}
            </Link>
            <span>{cafe.neighbourhood}</span>
          </div>
        ))}
      </div>
    </>
  );
}
