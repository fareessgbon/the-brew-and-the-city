// Minimal — this build only ever writes to two tables (waitlist,
// survey_responses — see migration 0021) and reads one more (cafes, for the
// homepage's real quiz preview, restored from the full product's own
// seeded data). The full product's complete schema lives in the real app's
// copy of this file; duplicating all of it here would describe dozens of
// tables this codebase never touches.

export type SurveyType = 'cafe_partner' | 'consumer';

export interface Database {
  public: {
    Tables: {
      // Read-only from here — this build only ever selects from cafes
      // (app/page.tsx), never writes. Row covers exactly the columns that
      // query uses; Insert/Update are typed but unused.
      cafes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          neighbourhood: string | null;
          verified_at: string | null;
          drink_score: number;
          energy_score: number;
          aesthetic_score: number;
          pace_score: number;
          adventure_score: number;
          price_score: number;
          food_score: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          neighbourhood?: string | null;
          verified_at?: string | null;
          drink_score?: number;
          energy_score?: number;
          aesthetic_score?: number;
          pace_score?: number;
          adventure_score?: number;
          price_score?: number;
          food_score?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          neighbourhood?: string | null;
          verified_at?: string | null;
          drink_score?: number;
          energy_score?: number;
          aesthetic_score?: number;
          pace_score?: number;
          adventure_score?: number;
          price_score?: number;
          food_score?: number;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      survey_responses: {
        Row: {
          id: string;
          survey: SurveyType;
          answers: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey: SurveyType;
          answers: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey?: SurveyType;
          answers?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      // error_logs exists in the shared project (from the full product's
      // migrations) and lib/server/logError.ts writes to it — typed loosely
      // here since this build never reads it back.
      error_logs: {
        Row: Record<string, unknown>;
        Insert: {
          scope: string;
          message: string;
          detail?: Record<string, unknown> | null;
          user_id?: string | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    // Required by @supabase/postgrest-js's GenericSchema alongside Tables,
    // even empty — omitting them silently breaks Insert/Update type
    // inference (every .insert() call ends up typed as `never[]`) rather
    // than raising a clear error about the missing keys.
    Views: Record<string, never>;
    // Leaving this empty has the same silent failure mode as Views/Tables
    // above, just for .rpc() instead of .insert() — every call's Args
    // infers as `never`, so any real args object is rejected. Only
    // function this build actually calls (migration 0022).
    Functions: {
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_ms: number };
        Returns: { allowed: boolean; remaining: number; retry_after_seconds: number }[];
      };
    };
  };
}
