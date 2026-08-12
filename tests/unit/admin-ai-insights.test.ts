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

describe("getAiInsights", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("computes success rate from analysis_results (success) vs analysis_jobs (failed)", async () => {
    seedRow(harness.store, "analysis_results", {
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      generated_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_jobs", {
      status: "failed",
      error_message: "A analise foi recusada pelos filtros de seguranca da IA (x)",
      created_at: new Date().toISOString(),
    });

    const { getAiInsights } = await import("@/modules/admin/ai-insights");
    const insights = await getAiInsights("30d");

    expect(insights.succeeded).toBe(1);
    expect(insights.failed).toBe(1);
    expect(insights.successRate).toBeCloseTo(0.5);
  });

  it("classifies real error messages using the exact strings run-analysis.ts throws", async () => {
    seedRow(harness.store, "analysis_jobs", {
      status: "failed",
      error_message: "A resposta da IA foi truncada por limite de tokens.",
      created_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_jobs", {
      status: "failed",
      error_message: "Algum erro totalmente inesperado de infraestrutura.",
      created_at: new Date().toISOString(),
    });

    const { getAiInsights } = await import("@/modules/admin/ai-insights");
    const insights = await getAiInsights("30d");

    const categories = insights.errorBreakdown.map((row) => row.category).sort();
    expect(categories).toEqual(["limite_tokens", "outro"]);
  });

  it("represents multiple model/prompt-version combinations as separate distribution rows", async () => {
    seedRow(harness.store, "analysis_results", {
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.0",
      generated_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_results", {
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      generated_at: new Date().toISOString(),
    });
    seedRow(harness.store, "analysis_results", {
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      generated_at: new Date().toISOString(),
    });

    const { getAiInsights } = await import("@/modules/admin/ai-insights");
    const insights = await getAiInsights("30d");

    expect(insights.modelDistribution).toHaveLength(2);
    const newer = insights.modelDistribution.find(
      (row) => row.promptVersion === "silas-diagnostic-prompt@0.2.1",
    );
    expect(newer?.count).toBe(2);
  });

  it("excludes results outside the requested period", async () => {
    seedRow(harness.store, "analysis_results", {
      model_provider: "anthropic",
      model_name: "claude-sonnet-5",
      prompt_version: "silas-diagnostic-prompt@0.2.1",
      generated_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const { getAiInsights } = await import("@/modules/admin/ai-insights");
    const insights = await getAiInsights("30d");

    expect(insights.succeeded).toBe(0);
  });

  it("does not throw and returns nulls when there is no data yet", async () => {
    const { getAiInsights } = await import("@/modules/admin/ai-insights");
    const insights = await getAiInsights("today");

    expect(insights.averageDurationMs).toBeNull();
    expect(insights.averageCostUsdCents).toBeNull();
    expect(insights.totalCostUsdCents).toBe(0);
    expect(insights.successRate).toBeNull();
  });
});
