'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SessionState {
  loading: boolean;
  signedIn: boolean;
  email: string | null;
  isAdmin: boolean;
  onboardingCompleted: boolean;
}

const SessionContext = createContext<SessionState>({
  loading: true,
  signedIn: false,
  email: null,
  isAdmin: false,
  onboardingCompleted: false,
});

// Single place that talks to Supabase auth + /api/session — every nav
// component reads from this context instead of fetching its own session,
// so a page with a header, an account menu, and a bottom nav still only
// makes one round trip.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    loading: true,
    signedIn: false,
    email: null,
    isAdmin: false,
    onboardingCompleted: false,
  });
  // Avoids two overlapping /api/session fetches if getSession() resolves
  // and onAuthStateChange both fire close together on first load.
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const p = fetch('/api/session')
      .then((r) => r.json())
      .then((data) => setState({ loading: false, ...data }))
      .catch(() => setState((prev) => ({ ...prev, loading: false })))
      .finally(() => {
        inFlight.current = null;
      });
    inFlight.current = p;
    return p;
  }, []);

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
