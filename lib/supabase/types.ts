// This build touches four pre-launch tables (waitlist, survey_responses,
// cafes, error_logs — see the comments on each below) plus the five real
// product tables behind the signed-in account area (users, taste_profiles,
// saved_cafes, visits, rewards) added once /discover grew from a soft-
// gated café list into the full dashboard (Today's Pick, City List, The
// City Card, Your Taste). Those five tables and the `receipts` bucket
// already existed live in the shared Supabase project — this file was
// just never updated to type them. Still not the full product schema
// (reward_items, cafe_attributes, menu_items, partner_applications, the
// café portal columns on cafes/rewards stay untyped here — nothing in
// this codebase reads or writes them yet).

// 'job_application' (migration 0026) is a survey row only in the storage
// sense — /careers/*/apply reuses this table for its answer blob and,
// unlike the consumer survey, actually uses the review workflow below.
// 'cafe_taste_vector' (migration 0029) is the same story again — a café
// answering the admin editor's own seven questions about itself
// (/make-brew-better/cafe-taste-survey), reviewed and applied to a real
// cafes row deliberately rather than writing there directly.
export type SurveyType = 'cafe_partner' | 'consumer' | 'job_application' | 'cafe_taste_vector';
// Admin review workflow (migration 0023) — see chat, "similar to the
// launch site admin". Exposed in the UI for cafe_partner, job_application
// and cafe_taste_vector rows, not consumer ones (those are aggregate
// signal — named, but not individual applications to action).
export type SurveyStatus = 'new' | 'contacted' | 'selected' | 'declined';

// migration 0008 — a visit starts 'pending' the moment a receipt is
// uploaded and only counts toward the City Card once an admin marks it
// 'approved' (see lib/server/cityCard.ts). Rejected rows stay in the table
// (an audit trail of what didn't qualify) rather than being deleted.
export type VisitStatus = 'pending' | 'approved' | 'rejected';
// migration 0008 — 'active' the moment a member's 5th stamp is approved,
// 'redeemed' once they've claimed the free item. No café portal exists
// yet (see the plan's out-of-scope note), so redemption is recorded by
// admin, the same way approval is.
export type RewardStatus = 'active' | 'redeemed';

export interface Database {
  public: {
    Tables: {
      // The one table this build both reads and writes beyond the two
      // survey tables: the homepage's real quiz preview selects from it,
      // and /admin/cafes is where its rows get entered by hand. Columns
      // below are the ones those two surfaces touch — the full product's
      // cafes table has plenty more (portal_pin, contract dates, the
      // founding-partner lifecycle) that nothing here reads or writes, so
      // they're deliberately absent rather than typed and unused.
      cafes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          city: string;
          neighbourhood: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          website_url: string | null;
          instagram_handle: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          price_band: string | null;
          drink_categories: string[];
          // { "mon": ["07:00","18:00"], ... } — a missing day means closed
          // (migration 0001). Typed loosely because jsonb can hold anything
          // a previous writer put there; lib/data/cafeFields.ts has the
          // shape the editor actually reads and writes.
          opening_hours: Record<string, unknown> | null;
          partner_status: string;
          is_active: boolean;
          verified_at: string | null;
          drink_score: number;
          energy_score: number;
          aesthetic_score: number;
          pace_score: number;
          adventure_score: number;
          price_score: number;
          food_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          city?: string;
          neighbourhood?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          website_url?: string | null;
          instagram_handle?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          price_band?: string | null;
          drink_categories?: string[];
          opening_hours?: Record<string, unknown> | null;
          partner_status?: string;
          is_active?: boolean;
          verified_at?: string | null;
          drink_score?: number;
          energy_score?: number;
          aesthetic_score?: number;
          pace_score?: number;
          adventure_score?: number;
          price_score?: number;
          food_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          city?: string;
          neighbourhood?: string | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          website_url?: string | null;
          instagram_handle?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          price_band?: string | null;
          drink_categories?: string[];
          opening_hours?: Record<string, unknown> | null;
          partner_status?: string;
          is_active?: boolean;
          verified_at?: string | null;
          drink_score?: number;
          energy_score?: number;
          aesthetic_score?: number;
          pace_score?: number;
          adventure_score?: number;
          price_score?: number;
          food_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist: {
        // name / go_to_cafes are nullable (migration 0025) — optional in
        // the form, and rows created before that migration have neither.
        Row: {
          id: string;
          email: string;
          name: string | null;
          go_to_cafes: string | null;
          city: 'calgary' | 'toronto' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          go_to_cafes?: string | null;
          city?: 'calgary' | 'toronto' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          go_to_cafes?: string | null;
          city?: 'calgary' | 'toronto' | null;
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
          status: SurveyStatus;
          admin_notes: string | null;
          deleted_at: string | null;
          // When the applicant was actually told it's a no (migration
          // 0028) — set only by the reject route, never by the status
          // badge. Null on café and consumer rows, which have no such mail.
          rejection_email_sent_at: string | null;
        };
        Insert: {
          id?: string;
          survey: SurveyType;
          answers: Record<string, unknown>;
          created_at?: string;
          status?: SurveyStatus;
          admin_notes?: string | null;
          deleted_at?: string | null;
          rejection_email_sent_at?: string | null;
        };
        Update: {
          id?: string;
          survey?: SurveyType;
          answers?: Record<string, unknown>;
          created_at?: string;
          status?: SurveyStatus;
          admin_notes?: string | null;
          deleted_at?: string | null;
          rejection_email_sent_at?: string | null;
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
      // First-party funnel events (migration 0007), written by
      // /api/analytics/track; never read back by this build.
      analytics_events: {
        Row: Record<string, unknown>;
        Insert: {
          event: string;
          properties?: Record<string, unknown> | null;
          user_id?: string | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      // One row per auth.users id (migration 0001's handle_new_user
      // trigger, 0002, keeps this populated on signup) — the profile row
      // everything else in the account area hangs off of via user_id.
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      // One active profile per user (migration 0001) — Your Taste. Column
      // names match lib/matching's Dim keys exactly (drink/energy/
      // aesthetic/pace/adventure/price/food), unlike cafes' `${dim}_score`
      // columns, so lib/server/tasteProfile.ts can round-trip a TasteVector
      // without a rename step.
      taste_profiles: {
        Row: {
          id: string;
          user_id: string;
          drink: number;
          energy: number;
          aesthetic: number;
          pace: number;
          adventure: number;
          price: number;
          food: number;
          answered_dims: string[];
          go_to_cafe_id: string | null;
          radius_km: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          drink?: number;
          energy?: number;
          aesthetic?: number;
          pace?: number;
          adventure?: number;
          price?: number;
          food?: number;
          answered_dims?: string[];
          go_to_cafe_id?: string | null;
          radius_km?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          drink?: number;
          energy?: number;
          aesthetic?: number;
          pace?: number;
          adventure?: number;
          price?: number;
          food?: number;
          answered_dims?: string[];
          go_to_cafe_id?: string | null;
          radius_km?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      // City List — a café saved to try (migration 0001). unique(user_id,
      // cafe_id), so "save" is idempotent and "unsave" is a plain delete.
      saved_cafes: {
        Row: {
          id: string;
          user_id: string;
          cafe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cafe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cafe_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      // The City Card ledger (migration 0001, status/receipt columns added
      // by 0008, auto_check_reason by 0017). RLS no longer allows a direct
      // insert from a signed-in member (migration 0020, a deliberate fix
      // for a stamp-minting hole) — POST /api/visits is the only write
      // path, using the service-role client after validating the upload.
      visits: {
        Row: {
          id: string;
          user_id: string;
          cafe_id: string;
          match_pct: number | null;
          visited_at: string;
          receipt_image_path: string | null;
          stamp_awarded: boolean;
          status: VisitStatus;
          receipt_hash: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reward_id: string | null;
          auto_check_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cafe_id: string;
          match_pct?: number | null;
          visited_at?: string;
          receipt_image_path?: string | null;
          stamp_awarded?: boolean;
          status?: VisitStatus;
          receipt_hash?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reward_id?: string | null;
          auto_check_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cafe_id?: string;
          match_pct?: number | null;
          visited_at?: string;
          receipt_image_path?: string | null;
          stamp_awarded?: boolean;
          status?: VisitStatus;
          receipt_hash?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reward_id?: string | null;
          auto_check_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // The City Card itself, once earned (migration 0008). Created by
      // lib/server/cityCard.ts the moment a 5th visit is approved; `code`
      // is what the member shows at the counter. No café portal exists to
      // redeem it yet, so `status`/`redeemed_at` are set by admin.
      rewards: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          status: RewardStatus;
          redeemed_at_cafe_id: string | null;
          created_at: string;
          redeemed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          status?: RewardStatus;
          redeemed_at_cafe_id?: string | null;
          created_at?: string;
          redeemed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          status?: RewardStatus;
          redeemed_at_cafe_id?: string | null;
          created_at?: string;
          redeemed_at?: string | null;
        };
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
