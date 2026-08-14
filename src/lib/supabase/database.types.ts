export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      analysis_answers: {
        Row: {
          analysis_request_id: string;
          answer: Json;
          created_at: string;
          id: string;
          question_key: string;
        };
        Insert: {
          analysis_request_id: string;
          answer: Json;
          created_at?: string;
          id?: string;
          question_key: string;
        };
        Update: {
          analysis_request_id?: string;
          answer?: Json;
          created_at?: string;
          id?: string;
          question_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_answers_analysis_request_id_fkey";
            columns: ["analysis_request_id"];
            isOneToOne: false;
            referencedRelation: "analysis_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_assets: {
        Row: {
          analysis_request_id: string;
          asset_type: Database["public"]["Enums"]["asset_type"];
          created_at: string;
          deleted_at: string | null;
          deletion_reason: string | null;
          file_size_bytes: number;
          id: string;
          metadata: Json;
          mime_type: string;
          original_filename: string | null;
          processing_consent_at: string;
          retention_until: string | null;
          storage_bucket: string;
          storage_path: string;
          user_id: string | null;
        };
        Insert: {
          analysis_request_id: string;
          asset_type: Database["public"]["Enums"]["asset_type"];
          created_at?: string;
          deleted_at?: string | null;
          deletion_reason?: string | null;
          file_size_bytes: number;
          id?: string;
          metadata?: Json;
          mime_type: string;
          original_filename?: string | null;
          processing_consent_at: string;
          retention_until?: string | null;
          storage_bucket?: string;
          storage_path: string;
          user_id?: string | null;
        };
        Update: {
          analysis_request_id?: string;
          asset_type?: Database["public"]["Enums"]["asset_type"];
          created_at?: string;
          deleted_at?: string | null;
          deletion_reason?: string | null;
          file_size_bytes?: number;
          id?: string;
          metadata?: Json;
          mime_type?: string;
          original_filename?: string | null;
          processing_consent_at?: string;
          retention_until?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_assets_analysis_request_id_fkey";
            columns: ["analysis_request_id"];
            isOneToOne: false;
            referencedRelation: "analysis_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_jobs: {
        Row: {
          analysis_request_id: string;
          attempt_number: number;
          created_at: string;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          parent_job_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["analysis_status"];
          trigger_reason: string;
        };
        Insert: {
          analysis_request_id: string;
          attempt_number?: number;
          created_at?: string;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          parent_job_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["analysis_status"];
          trigger_reason?: string;
        };
        Update: {
          analysis_request_id?: string;
          attempt_number?: number;
          created_at?: string;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          parent_job_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["analysis_status"];
          trigger_reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_analysis_request_id_fkey";
            columns: ["analysis_request_id"];
            isOneToOne: false;
            referencedRelation: "analysis_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analysis_jobs_parent_job_id_fkey";
            columns: ["parent_job_id"];
            isOneToOne: false;
            referencedRelation: "analysis_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_reports: {
        Row: {
          analysis_result_id: string;
          blocked_reason: string | null;
          created_at: string;
          generated_at: string | null;
          id: string;
          pdf_storage_path: string | null;
          report_version: string;
          status: Database["public"]["Enums"]["report_status"];
          web_payload: Json | null;
        };
        Insert: {
          analysis_result_id: string;
          blocked_reason?: string | null;
          created_at?: string;
          generated_at?: string | null;
          id?: string;
          pdf_storage_path?: string | null;
          report_version: string;
          status?: Database["public"]["Enums"]["report_status"];
          web_payload?: Json | null;
        };
        Update: {
          analysis_result_id?: string;
          blocked_reason?: string | null;
          created_at?: string;
          generated_at?: string | null;
          id?: string;
          pdf_storage_path?: string | null;
          report_version?: string;
          status?: Database["public"]["Enums"]["report_status"];
          web_payload?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_reports_analysis_result_id_fkey";
            columns: ["analysis_result_id"];
            isOneToOne: false;
            referencedRelation: "analysis_results";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_requests: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          instagram_url: string | null;
          order_id: string | null;
          profile_photo_mime_type: string | null;
          profile_photo_storage_path: string | null;
          profile_type: Database["public"]["Enums"]["profile_type"];
          requires_review: boolean;
          review_reasons: string[];
          status: Database["public"]["Enums"]["analysis_status"];
          submitted_at: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          instagram_url?: string | null;
          order_id?: string | null;
          profile_photo_mime_type?: string | null;
          profile_photo_storage_path?: string | null;
          profile_type: Database["public"]["Enums"]["profile_type"];
          requires_review?: boolean;
          review_reasons?: string[];
          status?: Database["public"]["Enums"]["analysis_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          instagram_url?: string | null;
          order_id?: string | null;
          profile_photo_mime_type?: string | null;
          profile_photo_storage_path?: string | null;
          profile_type?: Database["public"]["Enums"]["profile_type"];
          requires_review?: boolean;
          review_reasons?: string[];
          status?: Database["public"]["Enums"]["analysis_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_requests_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_results: {
        Row: {
          analysis_job_id: string;
          analysis_request_id: string;
          confidence: Database["public"]["Enums"]["confidence_level"];
          created_at: string;
          estimated_cost_usd_cents: number | null;
          generated_at: string;
          id: string;
          input_tokens: number | null;
          is_test_analysis: boolean;
          methodology_version: string;
          model_duration_ms: number | null;
          model_name: string;
          model_provider: string;
          normalized_result: Json;
          output_tokens: number | null;
          prompt_version: string;
          raw_output: Json | null;
          requires_review: boolean;
          result_origin: Database["public"]["Enums"]["result_origin"];
          result_sequence: number;
          result_version: string;
          review_reasons: string[];
          score: number;
          score_kind: Database["public"]["Enums"]["score_kind"];
          scoring_version: string;
          weights_snapshot: Json;
        };
        Insert: {
          analysis_job_id: string;
          analysis_request_id: string;
          confidence: Database["public"]["Enums"]["confidence_level"];
          created_at?: string;
          estimated_cost_usd_cents?: number | null;
          generated_at?: string;
          id?: string;
          input_tokens?: number | null;
          is_test_analysis?: boolean;
          methodology_version: string;
          model_duration_ms?: number | null;
          model_name: string;
          model_provider: string;
          normalized_result: Json;
          output_tokens?: number | null;
          prompt_version: string;
          raw_output?: Json | null;
          requires_review?: boolean;
          result_origin: Database["public"]["Enums"]["result_origin"];
          result_sequence: number;
          result_version: string;
          review_reasons?: string[];
          score: number;
          score_kind: Database["public"]["Enums"]["score_kind"];
          scoring_version: string;
          weights_snapshot: Json;
        };
        Update: {
          analysis_job_id?: string;
          analysis_request_id?: string;
          confidence?: Database["public"]["Enums"]["confidence_level"];
          created_at?: string;
          estimated_cost_usd_cents?: number | null;
          generated_at?: string;
          id?: string;
          input_tokens?: number | null;
          is_test_analysis?: boolean;
          methodology_version?: string;
          model_duration_ms?: number | null;
          model_name?: string;
          model_provider?: string;
          normalized_result?: Json;
          output_tokens?: number | null;
          prompt_version?: string;
          raw_output?: Json | null;
          requires_review?: boolean;
          result_origin?: Database["public"]["Enums"]["result_origin"];
          result_sequence?: number;
          result_version?: string;
          review_reasons?: string[];
          score?: number;
          score_kind?: Database["public"]["Enums"]["score_kind"];
          scoring_version?: string;
          weights_snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_results_analysis_job_id_fkey";
            columns: ["analysis_job_id"];
            isOneToOne: true;
            referencedRelation: "analysis_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analysis_results_analysis_request_id_fkey";
            columns: ["analysis_request_id"];
            isOneToOne: false;
            referencedRelation: "analysis_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_scores: {
        Row: {
          analysis_result_id: string;
          confidence: Database["public"]["Enums"]["confidence_level"];
          created_at: string;
          dimension: Database["public"]["Enums"]["dimension_key"];
          effective_weight: number;
          evidence_summary: Json;
          id: string;
          limitations: string[];
          original_weight: number;
          recommendations: string[];
          score: number | null;
          status: Database["public"]["Enums"]["dimension_status"];
        };
        Insert: {
          analysis_result_id: string;
          confidence: Database["public"]["Enums"]["confidence_level"];
          created_at?: string;
          dimension: Database["public"]["Enums"]["dimension_key"];
          effective_weight: number;
          evidence_summary?: Json;
          id?: string;
          limitations?: string[];
          original_weight: number;
          recommendations?: string[];
          score?: number | null;
          status: Database["public"]["Enums"]["dimension_status"];
        };
        Update: {
          analysis_result_id?: string;
          confidence?: Database["public"]["Enums"]["confidence_level"];
          created_at?: string;
          dimension?: Database["public"]["Enums"]["dimension_key"];
          effective_weight?: number;
          evidence_summary?: Json;
          id?: string;
          limitations?: string[];
          original_weight?: number;
          recommendations?: string[];
          score?: number | null;
          status?: Database["public"]["Enums"]["dimension_status"];
        };
        Relationships: [
          {
            foreignKeyName: "analysis_scores_analysis_result_id_fkey";
            columns: ["analysis_result_id"];
            isOneToOne: false;
            referencedRelation: "analysis_results";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      methodology_versions: {
        Row: {
          active: boolean;
          created_at: string;
          criteria_snapshot: Json;
          id: string;
          name: string;
          profile_type: Database["public"]["Enums"]["profile_type"] | null;
          version: string;
          weights_snapshot: Json;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          criteria_snapshot: Json;
          id?: string;
          name: string;
          profile_type?: Database["public"]["Enums"]["profile_type"] | null;
          version: string;
          weights_snapshot: Json;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          criteria_snapshot?: Json;
          id?: string;
          name?: string;
          profile_type?: Database["public"]["Enums"]["profile_type"] | null;
          version?: string;
          weights_snapshot?: Json;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          customer_email: string;
          id: string;
          metadata: Json;
          price_id: string;
          product_id: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_reference: string | null;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          customer_email: string;
          id?: string;
          metadata?: Json;
          price_id: string;
          product_id: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_reference?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          customer_email?: string;
          id?: string;
          metadata?: Json;
          price_id?: string;
          product_id?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_reference?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_price_id_fkey";
            columns: ["price_id"];
            isOneToOne: false;
            referencedRelation: "product_prices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string | null;
          order_id: string;
          paid_at: string | null;
          provider: Database["public"]["Enums"]["payment_provider"];
          provider_payment_id: string | null;
          raw_payload: Json | null;
          status: Database["public"]["Enums"]["payment_status"];
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string | null;
          order_id: string;
          paid_at?: string | null;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_payment_id?: string | null;
          raw_payload?: Json | null;
          status?: Database["public"]["Enums"]["payment_status"];
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string | null;
          order_id?: string;
          paid_at?: string | null;
          provider?: Database["public"]["Enums"]["payment_provider"];
          provider_payment_id?: string | null;
          raw_payload?: Json | null;
          status?: Database["public"]["Enums"]["payment_status"];
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_prices: {
        Row: {
          active: boolean;
          amount_cents: number;
          created_at: string;
          currency: string;
          ends_at: string | null;
          id: string;
          product_id: string;
          starts_at: string;
        };
        Insert: {
          active?: boolean;
          amount_cents: number;
          created_at?: string;
          currency?: string;
          ends_at?: string | null;
          id?: string;
          product_id: string;
          starts_at?: string;
        };
        Update: {
          active?: boolean;
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          ends_at?: string | null;
          id?: string;
          product_id?: string;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          id: string;
          metadata: Json;
          name: string;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          name: string;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_versions: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          methodology_version_id: string | null;
          prompt_hash: string;
          prompt_snapshot: Json;
          version: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          methodology_version_id?: string | null;
          prompt_hash: string;
          prompt_snapshot: Json;
          version: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          methodology_version_id?: string | null;
          prompt_hash?: string;
          prompt_snapshot?: Json;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_versions_methodology_version_id_fkey";
            columns: ["methodology_version_id"];
            isOneToOne: false;
            referencedRelation: "methodology_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      scoring_versions: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          rules_snapshot: Json;
          version: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          rules_snapshot: Json;
          version: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          rules_snapshot?: Json;
          version?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      analysis_status:
        | "draft"
        | "waiting_payment"
        | "waiting_briefing"
        | "waiting_assets"
        | "ready"
        | "processing"
        | "requires_review"
        | "waiting_for_more_information"
        | "generating_report"
        | "completed"
        | "failed";
      asset_type:
        | "profile_top"
        | "feed"
        | "highlights"
        | "insights"
        | "stories"
        | "comments"
        | "other";
      confidence_level: "high" | "medium" | "low";
      dimension_key:
        | "positioning"
        | "first_impression"
        | "authority"
        | "content"
        | "identity"
        | "conversion"
        | "relationship"
        | "opportunities";
      dimension_status: "evaluated" | "insufficient_evidence";
      evidence_type: "visual" | "declared" | "inferred";
      order_status:
        "draft" | "pending" | "paid" | "canceled" | "refunded" | "failed";
      payment_provider: "mercado_pago";
      payment_status:
        "pending" | "approved" | "rejected" | "refunded" | "charged_back";
      profile_type: "business" | "creator";
      report_status: "blocked" | "generating" | "available" | "failed";
      result_origin: "ai_generated" | "development_fixture" | "human_reviewed";
      score_kind: "complete" | "partial";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      analysis_status: [
        "draft",
        "waiting_payment",
        "waiting_briefing",
        "waiting_assets",
        "ready",
        "processing",
        "requires_review",
        "waiting_for_more_information",
        "generating_report",
        "completed",
        "failed",
      ],
      asset_type: [
        "profile_top",
        "feed",
        "highlights",
        "insights",
        "stories",
        "comments",
        "other",
      ],
      confidence_level: ["high", "medium", "low"],
      dimension_key: [
        "positioning",
        "first_impression",
        "authority",
        "content",
        "identity",
        "conversion",
        "relationship",
        "opportunities",
      ],
      dimension_status: ["evaluated", "insufficient_evidence"],
      evidence_type: ["visual", "declared", "inferred"],
      order_status: [
        "draft",
        "pending",
        "paid",
        "canceled",
        "refunded",
        "failed",
      ],
      payment_provider: ["mercado_pago"],
      payment_status: [
        "pending",
        "approved",
        "rejected",
        "refunded",
        "charged_back",
      ],
      profile_type: ["business", "creator"],
      report_status: ["blocked", "generating", "available", "failed"],
      result_origin: ["ai_generated", "development_fixture", "human_reviewed"],
      score_kind: ["complete", "partial"],
    },
  },
} as const;
