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

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

describe("getOverviewMetrics", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("counts diagnoses by status and computes a success rate", async () => {
    seedRow(harness.store, "analysis_requests", { status: "completed", requires_review: false });
    seedRow(harness.store, "analysis_requests", { status: "completed", requires_review: false });
    seedRow(harness.store, "analysis_requests", { status: "failed", requires_review: false });
    seedRow(harness.store, "analysis_requests", { status: "processing", requires_review: false });
    seedRow(harness.store, "analysis_requests", { status: "requires_review", requires_review: true });

    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.diagnoses.total).toBe(5);
    expect(metrics.diagnoses.completed).toBe(2);
    expect(metrics.diagnoses.failed).toBe(1);
    expect(metrics.diagnoses.processing).toBe(1);
    expect(metrics.diagnoses.requiresReview).toBe(1);
    expect(metrics.diagnoses.successRate).toBeCloseTo(2 / 3);
  });

  it("never divides by zero when there is no completed or failed diagnosis yet", async () => {
    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.diagnoses.successRate).toBeNull();
    expect(metrics.processing.averageDurationMs).toBeNull();
    expect(metrics.cost.averagePerDiagnosisUsdCents).toBeNull();
  });

  it("averages cost while ignoring null estimated_cost_usd_cents (fixture-origin results)", async () => {
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: "req-1",
      result_sequence: 1,
      estimated_cost_usd_cents: 40,
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      generated_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: "req-2",
      result_sequence: 1,
      estimated_cost_usd_cents: null,
      model_provider: "not_integrated",
      model_name: "deterministic-fixture",
      prompt_version: "prompt-not-integrated@0.2.0",
      generated_at: new Date().toISOString(),
    });

    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.cost.averagePerDiagnosisUsdCents).toBe(40);
  });

  it("flags a job stuck in processing past the threshold as an attention signal", async () => {
    seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: "req-1",
      status: "processing",
      attempt_number: 1,
      started_at: isoMinutesAgo(30),
      created_at: isoMinutesAgo(30),
    });

    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.health.status).toBe("attention");
    expect(metrics.health.reasons.some((reason) => reason.includes("processing"))).toBe(true);
  });

  it("stays operational when the recent failure sample is too small to be meaningful", async () => {
    seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: "req-1",
      status: "failed",
      attempt_number: 1,
      started_at: isoMinutesAgo(10),
      finished_at: isoMinutesAgo(9),
      created_at: isoMinutesAgo(10),
    });

    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.health.status).toBe("operational");
  });

  it("flags attention when the recent failure rate crosses the threshold with enough sample", async () => {
    for (let i = 0; i < 3; i += 1) {
      seedRow(harness.store, "analysis_jobs", {
        analysis_request_id: `req-ok-${i}`,
        status: "completed",
        attempt_number: 1,
        started_at: isoMinutesAgo(10),
        finished_at: isoMinutesAgo(9),
        created_at: isoMinutesAgo(10),
      });
    }
    for (let i = 0; i < 3; i += 1) {
      seedRow(harness.store, "analysis_jobs", {
        analysis_request_id: `req-fail-${i}`,
        status: "failed",
        attempt_number: 1,
        started_at: isoMinutesAgo(10),
        finished_at: isoMinutesAgo(9),
        created_at: isoMinutesAgo(10),
      });
    }

    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.health.status).toBe("attention");
  });

  it("represents distinct models/prompt versions instead of masking them as one", async () => {
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: "req-1",
      result_sequence: 1,
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.0",
      generated_at: isoMinutesAgo(120),
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: "req-2",
      result_sequence: 1,
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      generated_at: isoMinutesAgo(1),
    });

    const { getOverviewMetrics } = await import("@/modules/admin/metrics");
    const metrics = await getOverviewMetrics();

    expect(metrics.latestModel?.promptVersion).toBe("silas-diagnostic-prompt@0.2.1");
  });
});

describe("getAttentionItems", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("reports no critical occurrences when the store is empty", async () => {
    const { getAttentionItems } = await import("@/modules/admin/metrics");
    const items = await getAttentionItems();

    expect(items).toEqual([]);
  });

  it("surfaces failed requests as a clickable, filtered attention item", async () => {
    seedRow(harness.store, "analysis_requests", { status: "failed", requires_review: false });
    seedRow(harness.store, "analysis_requests", { status: "failed", requires_review: false });

    const { getAttentionItems } = await import("@/modules/admin/metrics");
    const items = await getAttentionItems();

    const errorItem = items.find((item) => item.kind === "errors");
    expect(errorItem?.count).toBe(2);
    expect(errorItem?.href).toBe("/admin/diagnosticos?status=failed");
  });

  it("surfaces requests with 3+ attempts as repeated_attempts", async () => {
    seedRow(harness.store, "analysis_jobs", { analysis_request_id: "req-1", attempt_number: 3 });

    const { getAttentionItems } = await import("@/modules/admin/metrics");
    const items = await getAttentionItems();

    const repeated = items.find((item) => item.kind === "repeated_attempts");
    expect(repeated?.count).toBe(1);
  });
});
