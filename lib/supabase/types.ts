// Minimal — this build only ever touches two tables (see migration 0021).
// The full product's schema lives in the real app's copy of this file;
// duplicating it here would describe dozens of tables this codebase never
// reads or writes.

export type SurveyType = 'cafe_partner' | 'consumer';

export interface Database {
  public: {
    Tables: {
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
    Functions: Record<string, never>;
  };
}
