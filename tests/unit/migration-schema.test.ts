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
const aiResultMetadataMigration = readFileSync(
  new URL(
    "../../supabase/migrations/0005_add_ai_result_metadata.sql",
    import.meta.url,
  ),
  "utf8",
);
const adminFoundationsMigration = readFileSync(
  new URL(
    "../../supabase/migrations/0006_admin_foundations.sql",
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

  it("adds nullable AI usage/cost metadata and a non-null is_test_analysis flag", () => {
    for (const column of [
      "input_tokens integer",
      "output_tokens integer",
      "model_duration_ms integer",
      "estimated_cost_usd_cents integer",
    ]) {
      expect(aiResultMetadataMigration).toContain(`add column ${column},`);
    }

    expect(aiResultMetadataMigration).toContain(
      "add column is_test_analysis boolean not null default false;",
    );
    expect(aiResultMetadataMigration).toContain(
      "check (input_tokens is null or input_tokens >= 0)",
    );
    expect(aiResultMetadataMigration).toContain(
      "check (output_tokens is null or output_tokens >= 0)",
    );
  });

  it("syncs public.profiles from auth.users on both insert and identity-changing update", () => {
    expect(adminFoundationsMigration).toContain(
      "create or replace function public.handle_new_user()",
    );
    expect(adminFoundationsMigration).toContain(
      "after insert on auth.users",
    );
    expect(adminFoundationsMigration).toContain(
      "create or replace function public.handle_user_identity_update()",
    );
    expect(adminFoundationsMigration).toContain(
      "after update on auth.users",
    );
    expect(adminFoundationsMigration).toContain(
      "new.email is distinct from old.email",
    );
    expect(adminFoundationsMigration).toContain(
      "security definer",
    );
    expect(adminFoundationsMigration).toContain(
      "insert into public.profiles (id, full_name, email)\nselect id, raw_user_meta_data ->> 'full_name', email\nfrom auth.users",
    );
  });

  it("adds admin query indexes without touching existing tables or policies", () => {
    for (const index of [
      "create index if not exists analysis_requests_status_idx on public.analysis_requests (status);",
      "create index if not exists analysis_requests_created_at_idx on public.analysis_requests (created_at);",
      "create index if not exists analysis_jobs_status_started_at_idx on public.analysis_jobs (status, started_at);",
      "create index if not exists analysis_results_generated_at_idx on public.analysis_results (generated_at);",
      "create index if not exists analysis_results_model_prompt_idx on public.analysis_results (model_name, prompt_version);",
      "create index if not exists profiles_created_at_idx on public.profiles (created_at);",
    ]) {
      expect(adminFoundationsMigration).toContain(index);
    }

    expect(adminFoundationsMigration).not.toContain("drop table");
    expect(adminFoundationsMigration).not.toContain("drop policy");
    expect(adminFoundationsMigration).not.toContain("alter table public.profiles\n  alter column");
  });
});
