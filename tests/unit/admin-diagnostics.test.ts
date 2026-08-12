import { beforeEach, describe, expect, it, vi } from "vitest";

import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import { resetFakeStore } from "../mocks/persistence-harness";

const harness = vi.hoisted(() => ({ store: {} as FakeStore }));

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

describe("listDiagnosticsForAdmin", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("respects the status filter", async () => {
    seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_requests", {
      status: "failed",
      requires_review: false,
      profile_type: "creator",
      created_at: new Date().toISOString(),
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({ status: "failed" });

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]!.status).toBe("failed");
    expect(page.total).toBe(1);
  });

  it("respects the requiresReview filter and reports the flag correctly", async () => {
    seedRow(harness.store, "analysis_requests", {
      status: "requires_review",
      requires_review: true,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({ requiresReview: true });

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]!.requiresReview).toBe(true);
  });

  it("paginates server-side instead of returning every row", async () => {
    for (let i = 0; i < 5; i += 1) {
      seedRow(harness.store, "analysis_requests", {
        status: "completed",
        requires_review: false,
        profile_type: "business",
        created_at: new Date(Date.now() - i * 1000).toISOString(),
      });
    }

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({ page: 1, pageSize: 2 });

    expect(page.rows).toHaveLength(2);
    expect(page.total).toBe(5);
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(2);
  });

  it("finds a diagnosis by exact id search", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({ search: request.id as string });

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]!.id).toBe(request.id);
  });

  it("finds a diagnosis by Instagram URL substring", async () => {
    seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      instagram_url: "https://instagram.com/loja_acme",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      instagram_url: "https://instagram.com/outro_perfil",
      created_at: new Date().toISOString(),
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({ search: "acme" });

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]!.instagramUrl).toContain("loja_acme");
  });

  it("finds a diagnosis by customer name via profiles", async () => {
    seedRow(harness.store, "profiles", {
      id: "user-1",
      full_name: "Maria Silva",
      email: "maria@example.com",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_requests", {
      user_id: "user-2",
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({ search: "Maria" });

    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]!.userFullName).toBe("Maria Silva");
    expect(page.rows[0]!.userEmail).toBe("maria@example.com");
  });

  it("shows null cost/tokens without throwing when a result has no AI usage data", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: request.id,
      result_sequence: 1,
      score: 65,
      model_name: "deterministic-fixture",
      prompt_version: "prompt-not-integrated@0.2.0",
      input_tokens: null,
      output_tokens: null,
      model_duration_ms: null,
      estimated_cost_usd_cents: null,
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({});

    expect(page.rows[0]!.totalTokens).toBeNull();
    expect(page.rows[0]!.estimatedCostUsdCents).toBeNull();
    expect(page.rows[0]!.score).toBe(65);
  });

  it("counts reprocessing attempts and picks the latest result across retries", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_jobs", { analysis_request_id: request.id, attempt_number: 1 });
    seedRow(harness.store, "analysis_jobs", { analysis_request_id: request.id, attempt_number: 2 });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: request.id,
      result_sequence: 1,
      score: 40,
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: request.id,
      result_sequence: 2,
      score: 71,
    });

    const { listDiagnosticsForAdmin } = await import("@/modules/admin/diagnostics");
    const page = await listDiagnosticsForAdmin({});

    expect(page.rows[0]!.attemptCount).toBe(2);
    expect(page.rows[0]!.score).toBe(71);
  });
});

describe("getDiagnosisForAdmin", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("returns null for a diagnosis that does not exist", async () => {
    const { getDiagnosisForAdmin } = await import("@/modules/admin/diagnostics");
    const detail = await getDiagnosisForAdmin("00000000-0000-0000-0000-000000000000");

    expect(detail).toBeNull();
  });

  it("reads the persisted result instead of recalculating scoring", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      status: "completed",
      requires_review: false,
      profile_type: "business",
      review_reasons: [],
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: request.id,
      result_sequence: 1,
      score_kind: "complete",
      confidence: "high",
      requires_review: false,
      review_reasons: [],
      methodology_version: "methodology-8d@0.2.0",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      scoring_version: "scoring-8d@0.2.0",
      result_version: "analysis-result@0.2.0",
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      result_origin: "ai_generated",
      is_test_analysis: true,
      generated_at: new Date().toISOString(),
      normalized_result: { score: 71, classification: "consistent" },
    });

    const { getDiagnosisForAdmin } = await import("@/modules/admin/diagnostics");
    const detail = await getDiagnosisForAdmin(request.id as string);

    expect(detail?.latestResult?.normalizedResult).toEqual({
      score: 71,
      classification: "consistent",
    });
    expect(detail?.latestResult?.promptVersion).toBe("silas-diagnostic-prompt@0.2.1");
  });

  it("returns a null latestResult and report when no result was persisted yet", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      status: "processing",
      requires_review: false,
      profile_type: "creator",
      review_reasons: [],
    });

    const { getDiagnosisForAdmin } = await import("@/modules/admin/diagnostics");
    const detail = await getDiagnosisForAdmin(request.id as string);

    expect(detail?.latestResult).toBeNull();
    expect(detail?.report).toBeNull();
  });
});
