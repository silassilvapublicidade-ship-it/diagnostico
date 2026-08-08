export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      profile_type: "business" | "creator";
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
      confidence_level: "high" | "medium" | "low";
      evidence_type: "visual" | "declared" | "inferred";
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
      order_status:
        "draft" | "pending" | "paid" | "canceled" | "refunded" | "failed";
      payment_provider: "mercado_pago";
      payment_status:
        "pending" | "approved" | "rejected" | "refunded" | "charged_back";
      asset_type:
        | "profile_top"
        | "feed"
        | "highlights"
        | "insights"
        | "stories"
        | "comments"
        | "other";
      score_kind: "complete" | "partial";
      report_status: "blocked" | "generating" | "available" | "failed";
    };
    Tables: {
      analysis_assets: {
        Row: {
          id: string;
          analysis_request_id: string;
          user_id: string | null;
          asset_type: Database["public"]["Enums"]["asset_type"];
          storage_bucket: string;
          storage_path: string;
          original_filename: string | null;
          mime_type: string;
          file_size_bytes: number;
          metadata: Json;
          retention_until: string | null;
          processing_consent_at: string;
          deleted_at: string | null;
          deletion_reason: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["analysis_assets"]["Row"]
        > &
          Pick<
            Database["public"]["Tables"]["analysis_assets"]["Row"],
            | "analysis_request_id"
            | "asset_type"
            | "storage_bucket"
            | "storage_path"
            | "mime_type"
            | "file_size_bytes"
            | "processing_consent_at"
          >;
        Update: Partial<Database["public"]["Tables"]["analysis_assets"]["Row"]>;
      };
      analysis_results: {
        Row: {
          id: string;
          analysis_request_id: string;
          analysis_job_id: string;
          result_sequence: number;
          score_kind: Database["public"]["Enums"]["score_kind"];
          score: number;
          confidence: Database["public"]["Enums"]["confidence_level"];
          requires_review: boolean;
          review_reasons: string[];
          methodology_version: string;
          prompt_version: string;
          scoring_version: string;
          result_version: string;
          model_provider: string;
          model_name: string;
          weights_snapshot: Json;
          raw_output: Json | null;
          normalized_result: Json;
          generated_at: string;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["analysis_results"]["Row"]
        > &
          Pick<
            Database["public"]["Tables"]["analysis_results"]["Row"],
            | "analysis_request_id"
            | "analysis_job_id"
            | "result_sequence"
            | "score_kind"
            | "score"
            | "confidence"
            | "methodology_version"
            | "prompt_version"
            | "scoring_version"
            | "result_version"
            | "model_provider"
            | "model_name"
            | "weights_snapshot"
            | "normalized_result"
          >;
        Update: Partial<
          Database["public"]["Tables"]["analysis_results"]["Row"]
        >;
      };
    };
  };
};
