'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CITIES, CITY_LABELS, type City } from '@/lib/data/cafeFields';
import { track } from '@/lib/analytics';

// The visitor's city, asked once and remembered. It lives in localStorage
// for client components and in a `city` cookie so server pages (Discover)
// can scope their queries to it without a round-trip of their own. Changing
// it refreshes the route so server-rendered content follows.
const KEY = 'city';

interface CityContextValue {
  city: City | null;
  /** False until the stored choice has been read — avoids flashing the
   * "choose your city" prompt at someone who already chose. */
  ready: boolean;
  setCity: (city: City) => void;
}

const CityContext = createContext<CityContextValue>({ city: null, ready: false, setCity: () => {} });

export function useCity() {
  return useContext(CityContext);
}

function isCity(value: unknown): value is City {
  return typeof value === 'string' && (CITIES as readonly string[]).includes(value);
}

export function CityProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [city, setCityState] = useState<City | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
      // The quiz used to keep its own "Calgary"/"Toronto" answer.
      if (!saved) saved = localStorage.getItem('quizCity')?.toLowerCase() ?? null;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time, client-only localStorage read.
    if (isCity(saved)) setCityState(saved);
    setReady(true);
  }, []);

  const setCity = useCallback(
    (next: City) => {
      setCityState(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {}
      document.cookie = `${KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      track('city_selected', { city: next });
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ city, ready, setCity }), [city, ready, setCity]);
  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

// Header control: both cities, always visible, current one pressed.
export function CitySwitcher() {
  const { city, ready, setCity } = useCity();
  if (!ready) return <div className="city-switch" aria-hidden="true" />;
  return (
    <div className="city-switch" role="group" aria-label="Your city">
      {CITIES.map((c) => (
        <button key={c} type="button" aria-pressed={city === c} onClick={() => setCity(c)}>
          {CITY_LABELS[c]}
        </button>
      ))}
    </div>
  );
}

// First-visit prompt on the homepage: a slim bar at the bottom, not a modal
// — it never covers the page or stops someone reading before they've decided
// to trust the site. Skippable; the quiz asks again if nothing's been chosen.
export function CityPrompt() {
  const { city, ready, setCity } = useCity();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  if (!ready || city || dismissed || pathname !== '/') return null;
  return (
    <div className="city-banner" role="region" aria-label="Choose your city">
      <span className="city-banner-text">Which city are you in? We&apos;ll tailor cafés and matches to it.</span>
      <div className="city-banner-options">
        {CITIES.map((c) => (
          <button key={c} type="button" className="btn btn-primary" onClick={() => setCity(c)}>
            {CITY_LABELS[c]}
          </button>
        ))}
      </div>
      <button type="button" className="city-banner-close" aria-label="Dismiss" onClick={() => setDismissed(true)}>
        ×
      </button>
    </div>
  );
}
