import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/0001_initial_schema.sql", import.meta.url),
  "utf8",
);
const resultOriginMigration = readFileSync(
  new URL(
    "../../supabase/migrations/0004_add_analysis_result_origin.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("initial Supabase migration", () => {
  it("declares the expected enums, tables, function, triggers, indexes, and policies", () => {
    for (const enumName of [
      "profile_type",
      "dimension_key",
      "dimension_status",
      "confidence_level",
      "evidence_type",
      "analysis_status",
      "order_status",
      "payment_provider",
      "payment_status",
      "asset_type",
      "score_kind",
      "report_status",
    ]) {
      expect(migration).toContain(`create type public.${enumName}`);
    }

    for (const tableName of [
      "profiles",
      "products",
      "product_prices",
      "orders",
      "payments",
      "methodology_versions",
      "prompt_versions",
      "scoring_versions",
      "analysis_requests",
      "analysis_answers",
      "analysis_assets",
      "analysis_jobs",
      "analysis_results",
      "analysis_scores",
      "analysis_reports",
      "audit_logs",
    ]) {
      expect(migration).toContain(`create table public.${tableName}`);
      expect(migration).toContain(
        `alter table public.${tableName} enable row level security;`,
      );
    }

    expect(migration).toContain("create function public.set_updated_at()");
    expect(migration).toContain("create trigger profiles_set_updated_at");
    expect(migration).toContain("create trigger orders_set_updated_at");
    expect(migration).toContain(
      "create trigger analysis_requests_set_updated_at",
    );
    expect(migration).toContain("create index analysis_results_request_id_idx");
    expect(migration).toContain(
      'create policy "analysis_reports_select_own_result"',
    );
  });

  it("preserves retry and reprocessing history instead of overwriting results", () => {
    expect(migration).toContain(
      "analysis_request_id uuid not null references public.analysis_requests(id) on delete cascade",
    );
    expect(migration).toContain(
      "parent_job_id uuid references public.analysis_jobs(id)",
    );
    expect(migration).toContain("unique (analysis_job_id)");
    expect(migration).toContain(
      "unique (analysis_request_id, result_sequence)",
    );
    expect(migration).toContain("result_sequence integer not null check");
    expect(migration).toContain("weights_snapshot jsonb not null");
    expect(migration).toContain("methodology_version text not null");
    expect(migration).toContain("prompt_version text not null");
    expect(migration).toContain("scoring_version text not null");
    expect(migration).toContain("result_version text not null");
    expect(migration).toContain("model_provider text not null");
    expect(migration).toContain("model_name text not null");
    expect(migration).toContain(
      "generated_at timestamptz not null default now()",
    );
  });

  it("models LGPD retention and soft deletion for uploaded assets", () => {
    expect(migration).toContain("retention_until timestamptz");
    expect(migration).toContain("processing_consent_at timestamptz not null");
    expect(migration).toContain("deleted_at timestamptz");
    expect(migration).toContain("deletion_reason text");
    expect(migration).toContain("metadata jsonb not null default '{}'::jsonb");
    expect(migration).toContain(
      "check (deleted_at is not null or deletion_reason is null)",
    );
    expect(migration).toContain(
      "check (retention_until is null or retention_until > created_at)",
    );
  });

  it("keeps customer RLS scoped to own records and blocks unsafe updates", () => {
    expect(migration).toContain('create policy "orders_select_own"');
    expect(migration).toContain("for select using (user_id = auth.uid())");
    expect(migration).toContain('create policy "analysis_requests_select_own"');
    expect(migration).toContain(
      'create policy "analysis_assets_select_own_request"',
    );
    expect(migration).toContain(
      'create policy "analysis_results_select_own_request"',
    );
    expect(migration).toContain("analysis_results.requires_review = false");
    expect(migration).toContain("status = 'available'");

    for (const tableName of [
      "payments",
      "analysis_results",
      "analysis_scores",
      "methodology_versions",
      "prompt_versions",
      "scoring_versions",
      "audit_logs",
    ]) {
      expect(migration).not.toContain(`on public.${tableName}\n  for update`);
    }
  });

  it("prevents completed requests from still requiring review", () => {
    expect(migration).toContain(
      "check (status <> 'completed' or requires_review = false)",
    );
    expect(migration).toContain(
      "(status = 'evaluated' and score is not null)\n    or (status = 'insufficient_evidence' and score is null)",
    );
  });

  it("adds typed result origin for fixture, AI, and human-reviewed results", () => {
    expect(resultOriginMigration).toContain("create type public.result_origin");
    expect(resultOriginMigration).toContain("'ai_generated'");
    expect(resultOriginMigration).toContain("'development_fixture'");
    expect(resultOriginMigration).toContain("'human_reviewed'");
    expect(resultOriginMigration).toContain(
      "add column result_origin public.result_origin",
    );
    expect(resultOriginMigration).toContain(
      "alter column result_origin set not null",
    );
  });
});
