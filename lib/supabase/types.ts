// Hand-authored to match supabase/migrations/*.sql. Once things stabilize,
// regenerate with:
//   supabase gen types typescript --project-id umrjksuzcngnvpgstods > lib/supabase/types.ts
// and this file (including this comment) gets overwritten — that's expected.
//
// Row/Insert/Update are written out independently per table (not derived via
// Omit/Partial referencing each other) — Supabase's generic query builder
// resolves types poorly through recursive cross-references and silently
// collapses them to `never`.

export type PartnerStatus = 'listed' | 'partner' | 'featured' | 'founding_partner';
export type MenuItemCategory = 'matcha' | 'coffee' | 'tea' | 'food' | 'other';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type VisitStatus = 'pending' | 'approved' | 'rejected';
export type RewardStatus = 'active' | 'redeemed';
export type DrinkCategory = 'coffee' | 'matcha' | 'tea_chai' | 'refreshers_other';
export type RewardItemCategory = 'drink' | 'pastry' | 'food' | 'other';
export type PriceBand = '$' | '$$' | '$$$';
export type PartnerLifecycleStatus = 'active' | 'paused' | 'downgraded' | 'cancelled';
export type NoiseLevel = 'quiet' | 'moderate' | 'loud';
export type OnboardingStatus = 'pending_portal_setup' | 'active';
export type FeatureFlagKey =
  | 'matching_feed'
  | 'receipt_uploads'
  | 'ocr_processing'
  | 'automatic_receipt_approval'
  | 'cafe_review_queue'
  | 'reward_activation'
  | 'reward_redemption'
  | 'notifications';

export interface Database {
  public: {
    Tables: {
      cafes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          neighbourhood: string | null;
          opening_hours: Record<string, [string, string]> | null;
          drink_score: number;
          energy_score: number;
          aesthetic_score: number;
          pace_score: number;
          adventure_score: number;
          price_score: number;
          food_score: number;
          drink_categories: DrinkCategory[];
          monthly_redemption_cap: number;
          founding_partner_started_at: string | null;
          partner_status: PartnerStatus;
          verified_at: string | null;
          is_match_ready: boolean;
          portal_pin: string | null;
          is_active: boolean;
          contact_phone: string | null;
          contact_email: string | null;
          instagram_handle: string | null;
          website_url: string | null;
          price_band: PriceBand | null;
          photos: string[];
          stamps_enabled: boolean;
          rewards_enabled: boolean;
          contract_start_date: string | null;
          contract_end_date: string | null;
          monthly_price_cents: number | null;
          primary_contact_name: string | null;
          primary_contact_email: string | null;
          marketing_deliverables_owed: string | null;
          partner_lifecycle_status: PartnerLifecycleStatus;
          onboarding_status: OnboardingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          neighbourhood?: string | null;
          opening_hours?: Record<string, [string, string]> | null;
          drink_score?: number;
          energy_score?: number;
          aesthetic_score?: number;
          pace_score?: number;
          adventure_score?: number;
          price_score?: number;
          food_score?: number;
          drink_categories?: DrinkCategory[];
          monthly_redemption_cap?: number;
          founding_partner_started_at?: string | null;
          partner_status?: PartnerStatus;
          verified_at?: string | null;
          is_match_ready?: boolean;
          portal_pin?: string | null;
          is_active?: boolean;
          contact_phone?: string | null;
          contact_email?: string | null;
          instagram_handle?: string | null;
          website_url?: string | null;
          price_band?: PriceBand | null;
          photos?: string[];
          stamps_enabled?: boolean;
          rewards_enabled?: boolean;
          contract_start_date?: string | null;
          contract_end_date?: string | null;
          monthly_price_cents?: number | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          marketing_deliverables_owed?: string | null;
          partner_lifecycle_status?: PartnerLifecycleStatus;
          onboarding_status?: OnboardingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          neighbourhood?: string | null;
          opening_hours?: Record<string, [string, string]> | null;
          drink_score?: number;
          energy_score?: number;
          aesthetic_score?: number;
          pace_score?: number;
          adventure_score?: number;
          price_score?: number;
          food_score?: number;
          drink_categories?: DrinkCategory[];
          monthly_redemption_cap?: number;
          founding_partner_started_at?: string | null;
          partner_status?: PartnerStatus;
          verified_at?: string | null;
          is_match_ready?: boolean;
          portal_pin?: string | null;
          is_active?: boolean;
          contact_phone?: string | null;
          contact_email?: string | null;
          instagram_handle?: string | null;
          website_url?: string | null;
          price_band?: PriceBand | null;
          photos?: string[];
          stamps_enabled?: boolean;
          rewards_enabled?: boolean;
          contract_start_date?: string | null;
          contract_end_date?: string | null;
          monthly_price_cents?: number | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          marketing_deliverables_owed?: string | null;
          partner_lifecycle_status?: PartnerLifecycleStatus;
          onboarding_status?: OnboardingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: { id: string; name: string | null; email: string; created_at: string };
        Insert: { id: string; name?: string | null; email: string; created_at?: string };
        Update: { id?: string; name?: string | null; email?: string; created_at?: string };
        Relationships: [];
      };
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
          worth_the_trip: boolean;
          home_latitude: number | null;
          home_longitude: number | null;
          home_neighbourhood: string | null;
          primary_drink_category: DrinkCategory | null;
          needs_non_dairy: boolean;
          needs_gluten_free: boolean;
          needs_wheelchair: boolean;
          onboarding_completed: boolean;
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
          worth_the_trip?: boolean;
          home_latitude?: number | null;
          home_longitude?: number | null;
          home_neighbourhood?: string | null;
          primary_drink_category?: DrinkCategory | null;
          needs_non_dairy?: boolean;
          needs_gluten_free?: boolean;
          needs_wheelchair?: boolean;
          onboarding_completed?: boolean;
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
          worth_the_trip?: boolean;
          home_latitude?: number | null;
          home_longitude?: number | null;
          home_neighbourhood?: string | null;
          primary_drink_category?: DrinkCategory | null;
          needs_non_dairy?: boolean;
          needs_gluten_free?: boolean;
          needs_wheelchair?: boolean;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'taste_profiles_go_to_cafe_id_fkey'; columns: ['go_to_cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      cafe_attributes: {
        Row: {
          cafe_id: string;
          oat: boolean;
          gluten_free: boolean;
          wheelchair: boolean;
          wifi: boolean;
          outlets: boolean;
          outdoor_seating: boolean;
          seating_notes: string | null;
          noise_level: NoiseLevel | null;
          average_wait_minutes: number | null;
          food_program: boolean;
          cash_accepted: boolean;
        };
        Insert: {
          cafe_id: string;
          oat?: boolean;
          gluten_free?: boolean;
          wheelchair?: boolean;
          wifi?: boolean;
          outlets?: boolean;
          outdoor_seating?: boolean;
          seating_notes?: string | null;
          noise_level?: NoiseLevel | null;
          average_wait_minutes?: number | null;
          food_program?: boolean;
          cash_accepted?: boolean;
        };
        Update: {
          cafe_id?: string;
          oat?: boolean;
          gluten_free?: boolean;
          wheelchair?: boolean;
          wifi?: boolean;
          outlets?: boolean;
          outdoor_seating?: boolean;
          seating_notes?: string | null;
          noise_level?: NoiseLevel | null;
          average_wait_minutes?: number | null;
          food_program?: boolean;
          cash_accepted?: boolean;
        };
        Relationships: [
          { foreignKeyName: 'cafe_attributes_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: true; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      menu_items: {
        Row: {
          id: string;
          cafe_id: string;
          name: string;
          description: string | null;
          price_cents: number | null;
          category: MenuItemCategory | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          name: string;
          description?: string | null;
          price_cents?: number | null;
          category?: MenuItemCategory | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cafe_id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number | null;
          category?: MenuItemCategory | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'menu_items_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      saved_cafes: {
        Row: { id: string; user_id: string; cafe_id: string; created_at: string };
        Insert: { id?: string; user_id: string; cafe_id: string; created_at?: string };
        Update: { id?: string; user_id?: string; cafe_id?: string; created_at?: string };
        Relationships: [
          { foreignKeyName: 'saved_cafes_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
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
        Relationships: [
          { foreignKeyName: 'visits_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_reward_id_fkey'; columns: ['reward_id']; isOneToOne: false; referencedRelation: 'rewards'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
        ];
      };
      rewards: {
        Row: {
          id: string;
          user_id: string;
          code: string | null;
          status: RewardStatus;
          redeemed_at_cafe_id: string | null;
          pending_cafe_id: string | null;
          reward_item_id: string | null;
          activated_at: string | null;
          expires_at: string | null;
          created_at: string;
          redeemed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          code?: string | null;
          status?: RewardStatus;
          redeemed_at_cafe_id?: string | null;
          pending_cafe_id?: string | null;
          reward_item_id?: string | null;
          activated_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          redeemed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string | null;
          status?: RewardStatus;
          redeemed_at_cafe_id?: string | null;
          pending_cafe_id?: string | null;
          reward_item_id?: string | null;
          activated_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          redeemed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: 'rewards_redeemed_at_cafe_id_fkey'; columns: ['redeemed_at_cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
          { foreignKeyName: 'rewards_pending_cafe_id_fkey'; columns: ['pending_cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
          { foreignKeyName: 'rewards_reward_item_id_fkey'; columns: ['reward_item_id']; isOneToOne: false; referencedRelation: 'reward_items'; referencedColumns: ['id'] },
        ];
      };
      reward_items: {
        Row: {
          id: string;
          cafe_id: string;
          name: string;
          description: string | null;
          category: RewardItemCategory;
          price_cents: number | null;
          reimbursement_cents: number;
          monthly_cap: number | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cafe_id: string;
          name: string;
          description?: string | null;
          category?: RewardItemCategory;
          price_cents?: number | null;
          reimbursement_cents?: number;
          monthly_cap?: number | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cafe_id?: string;
          name?: string;
          description?: string | null;
          category?: RewardItemCategory;
          price_cents?: number | null;
          reimbursement_cents?: number;
          monthly_cap?: number | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'reward_items_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      partner_applications: {
        Row: {
          id: string;
          cafe_name: string;
          email: string;
          neighbourhood: string;
          instagram: string | null;
          status: ApplicationStatus;
          cafe_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cafe_name: string;
          email: string;
          neighbourhood: string;
          instagram?: string | null;
          status?: ApplicationStatus;
          cafe_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cafe_name?: string;
          email?: string;
          neighbourhood?: string;
          instagram?: string | null;
          status?: ApplicationStatus;
          cafe_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: 'partner_applications_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      cafe_feedback: {
        Row: { id: string; user_id: string; cafe_id: string; feedback: 'not_it'; created_at: string };
        Insert: { id?: string; user_id: string; cafe_id: string; feedback: 'not_it'; created_at?: string };
        Update: { id?: string; user_id?: string; cafe_id?: string; feedback?: 'not_it'; created_at?: string };
        Relationships: [
          { foreignKeyName: 'cafe_feedback_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      analytics_events: {
        Row: { id: string; event: string; user_id: string | null; properties: Record<string, unknown> | null; created_at: string };
        Insert: { id?: string; event: string; user_id?: string | null; properties?: Record<string, unknown> | null; created_at?: string };
        Update: { id?: string; event?: string; user_id?: string | null; properties?: Record<string, unknown> | null; created_at?: string };
        Relationships: [];
      };
      error_logs: {
        Row: { id: string; scope: string; message: string; detail: Record<string, unknown> | null; user_id: string | null; created_at: string };
        Insert: { id?: string; scope: string; message: string; detail?: Record<string, unknown> | null; user_id?: string | null; created_at?: string };
        Update: { id?: string; scope?: string; message?: string; detail?: Record<string, unknown> | null; user_id?: string | null; created_at?: string };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          admin_email: string;
          action: string;
          summary: string;
          detail: Record<string, unknown> | null;
          record_type: string | null;
          record_id: string | null;
          previous_value: Record<string, unknown> | null;
          new_value: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_email: string;
          action: string;
          summary: string;
          detail?: Record<string, unknown> | null;
          record_type?: string | null;
          record_id?: string | null;
          previous_value?: Record<string, unknown> | null;
          new_value?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_email?: string;
          action?: string;
          summary?: string;
          detail?: Record<string, unknown> | null;
          record_type?: string | null;
          record_id?: string | null;
          previous_value?: Record<string, unknown> | null;
          new_value?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      merchant_strings: {
        Row: { id: string; raw_string: string; cafe_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; raw_string: string; cafe_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; raw_string?: string; cafe_id?: string | null; created_at?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: 'merchant_strings_cafe_id_fkey'; columns: ['cafe_id']; isOneToOne: false; referencedRelation: 'cafes'; referencedColumns: ['id'] },
        ];
      };
      reimbursement_payments: {
        Row: { id: string; reward_id: string; paid_at: string; admin_email: string };
        Insert: { id?: string; reward_id: string; paid_at?: string; admin_email: string };
        Update: { id?: string; reward_id?: string; paid_at?: string; admin_email?: string };
        Relationships: [
          { foreignKeyName: 'reimbursement_payments_reward_id_fkey'; columns: ['reward_id']; isOneToOne: true; referencedRelation: 'rewards'; referencedColumns: ['id'] },
        ];
      };
      feature_flags: {
        Row: { key: FeatureFlagKey; enabled: boolean; updated_at: string; updated_by: string | null };
        Insert: { key: FeatureFlagKey; enabled?: boolean; updated_at?: string; updated_by?: string | null };
        Update: { key?: FeatureFlagKey; enabled?: boolean; updated_at?: string; updated_by?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
