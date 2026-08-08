import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureRedirectDigest } from "../mocks/persistence-harness";
import {
  seedRow,
  seedStorageFile,
  type FakeStore,
} from "../mocks/supabase-fake";
import { aiOutputBusinessComplete } from "../fixtures/ai-output-business-complete";
import {
  AiAnalysisError,
  generateAiDiagnosis,
} from "@/modules/ai/run-analysis";
import { runDiagnosisAnalysisAction } from "@/modules/analysis/actions";

const harness = vi.hoisted(() => ({
  store: {} as FakeStore,
  userId: "user-1" as string | null,
}));

const aiClientHarness = vi.hoisted(() => ({ model: "claude-sonnet-5" }));

const mockParse = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", async () => {
  const { createFakeAdminClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseAdminClient: () => createFakeAdminClient(harness.store),
  };
});

vi.mock("@/lib/supabase/server", async () => {
  const { createFakeServerClient } = await import("../mocks/supabase-fake");
  return {
    createSupabaseServerClient: async () =>
      createFakeServerClient(harness.store, harness.userId as string),
  };
});

vi.mock("@/modules/auth/session", () => ({
  requireUser: async () => {
    if (!harness.userId) {
      throw new Error("Unauthenticated");
    }
    return { id: harness.userId, email: `${harness.userId}@example.com` };
  },
}));

vi.mock("@/modules/ai/client", () => ({
  createAnthropicClient: () => ({ messages: { parse: mockParse } }),
  getAnthropicModel: () => aiClientHarness.model,
}));

const BUCKET = "analysis-assets";

function seedRequestWithAsset(
  store: FakeStore,
  ownerId: string,
  extra: Record<string, unknown> = {},
) {
  const request = seedRow(store, "analysis_requests", {
    user_id: ownerId,
    profile_type: "business",
    instagram_url: "https://instagram.com/acme",
    status: "ready",
    ...extra,
  });

  seedRow(store, "analysis_answers", {
    analysis_request_id: request.id,
    question_key: "mainObjective",
    answer: "crescer com mais clareza",
  });

  const storagePath = `${ownerId}/${request.id}/profile_top/topo.png`;
  seedRow(store, "analysis_assets", {
    analysis_request_id: request.id,
    user_id: ownerId,
    asset_type: "profile_top",
    storage_bucket: BUCKET,
    storage_path: storagePath,
    mime_type: "image/png",
    processing_consent_at: new Date().toISOString(),
  });
  seedStorageFile(store, BUCKET, storagePath, {
    data: new Uint8Array([1, 2, 3, 4]),
    type: "image/png",
  });

  return request;
}

function mockSuccessfulParse() {
  mockParse.mockResolvedValueOnce({
    stop_reason: "end_turn",
    stop_details: null,
    usage: { input_tokens: 4200, output_tokens: 1800 },
    parsed_output: aiOutputBusinessComplete,
  });
}

function buildFormData(requestId: string) {
  const formData = new FormData();
  formData.set("requestId", requestId);
  return formData;
}

beforeEach(() => {
  for (const key of Object.keys(harness.store)) {
    delete (harness.store as Record<string, unknown>)[key];
  }
  harness.userId = "user-1";
  aiClientHarness.model = "claude-sonnet-5";
  mockParse.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("generateAiDiagnosis", () => {
  it("never calls Anthropic and throws when the request does not belong to the caller", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-2",
      }),
    ).rejects.toBeInstanceOf(AiAnalysisError);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("never calls Anthropic and throws when there is no usable evidence", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      profile_type: "business",
      instagram_url: "https://instagram.com/acme",
      status: "ready",
    });

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-1",
      }),
    ).rejects.toThrow(/Nenhuma evidencia/);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("maps a successful structured response into a domain result, web payload, and usage", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulParse();

    const generated = await generateAiDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
    });

    expect(generated.result.requiresReview).toBe(false);
    expect(generated.result.modelProvider).toBe("anthropic");
    expect(generated.result.modelName).toBe("claude-sonnet-5");
    expect(generated.webPayload.executiveSummary).toBe(
      aiOutputBusinessComplete.executive_summary,
    );
    expect(generated.usage.inputTokens).toBe(4200);
    expect(generated.usage.outputTokens).toBe(1800);
    expect(generated.usage.estimatedCostUsdCents).not.toBeNull();
  });

  it("uses adaptive thinking and effort for an adaptive-capable model (claude-sonnet-5)", async () => {
    aiClientHarness.model = "claude-sonnet-5";
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulParse();

    await generateAiDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
    });

    const callArgs = mockParse.mock.calls[0]![0];
    expect(callArgs.thinking).toEqual({ type: "adaptive" });
    expect(callArgs.output_config.effort).toBe("medium");
  });

  it("uses extended thinking without effort for an extended-only model (claude-haiku-4-5-20251001)", async () => {
    aiClientHarness.model = "claude-haiku-4-5-20251001";
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulParse();

    await generateAiDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
    });

    const callArgs = mockParse.mock.calls[0]![0];
    expect(callArgs.thinking).toEqual({
      type: "enabled",
      budget_tokens: 6000,
    });
    expect(callArgs.output_config.effort).toBeUndefined();
  });

  it("treats stop_reason 'refusal' as a job failure, never a persisted result", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockParse.mockResolvedValueOnce({
      stop_reason: "refusal",
      stop_details: { category: "cyber" },
      usage: { input_tokens: 100, output_tokens: 0 },
      parsed_output: null,
    });

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-1",
      }),
    ).rejects.toThrow(/recusada/);
  });

  it("treats stop_reason 'max_tokens' as a job failure", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockParse.mockResolvedValueOnce({
      stop_reason: "max_tokens",
      stop_details: null,
      usage: { input_tokens: 100, output_tokens: 16000 },
      parsed_output: null,
    });

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-1",
      }),
    ).rejects.toThrow(/truncada/);
  });

  it("treats a null parsed_output (schema validation failure) as a job failure", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockParse.mockResolvedValueOnce({
      stop_reason: "end_turn",
      stop_details: null,
      usage: { input_tokens: 100, output_tokens: 50 },
      parsed_output: null,
    });

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-1",
      }),
    ).rejects.toThrow(/schema esperado/);
  });
});

describe("runDiagnosisAnalysisAction", () => {
  it("never creates a job or calls Anthropic when the requester does not own the request", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    harness.userId = "user-2";

    const digest = await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    expect(digest).toContain("/app/diagnosticos");
    expect(digest).not.toContain(`/app/diagnosticos/${request.id}`);
    expect(harness.store.analysis_jobs ?? []).toHaveLength(0);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("does not start a second run while one is already processing", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: request.id,
      status: "processing",
      attempt_number: 1,
      trigger_reason: "manual_analysis",
    });

    const digest = await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    expect(digest).toContain(`/app/diagnosticos/${request.id}`);
    expect(harness.store.analysis_jobs ?? []).toHaveLength(1);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("creates the first job as attempt 1 with no parent", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulParse();

    await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    const jobs = harness.store.analysis_jobs ?? [];
    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.attempt_number).toBe(1);
    expect(jobs[0]!.parent_job_id).toBeNull();
    expect(jobs[0]!.trigger_reason).toBe("manual_analysis");
  });

  it("creates a retry as the next attempt with parent_job_id set", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    const priorJob = seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: request.id,
      status: "ready",
      attempt_number: 1,
      trigger_reason: "initial_submission",
    });
    mockSuccessfulParse();

    await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    const jobs = harness.store.analysis_jobs ?? [];
    expect(jobs).toHaveLength(2);
    const retryJob = jobs.find((job) => job.id !== priorJob.id)!;
    expect(retryJob.attempt_number).toBe(2);
    expect(retryJob.parent_job_id).toBe(priorJob.id);
    expect(retryJob.trigger_reason).toBe("retry");
  });

  it("persists analysis_results/scores/reports with tokens and is_test_analysis on success", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulParse();

    const digest = await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    expect(digest).toContain(`/app/diagnosticos/${request.id}`);

    const results = harness.store.analysis_results ?? [];
    expect(results).toHaveLength(1);
    expect(results[0]!.result_origin).toBe("ai_generated");
    expect(results[0]!.is_test_analysis).toBe(true);
    expect(results[0]!.input_tokens).toBe(4200);
    expect(results[0]!.output_tokens).toBe(1800);

    expect(harness.store.analysis_scores ?? []).toHaveLength(8);

    const reports = harness.store.analysis_reports ?? [];
    expect(reports).toHaveLength(1);
    expect(reports[0]!.status).toBe("available");
    expect(
      (reports[0]!.web_payload as { executiveSummary: string })
        .executiveSummary,
    ).toBe(aiOutputBusinessComplete.executive_summary);

    const job = (harness.store.analysis_jobs ?? [])[0]!;
    expect(job.status).toBe("completed");

    const updatedRequest = (harness.store.analysis_requests ?? [])[0]!;
    expect(updatedRequest.status).toBe("completed");
  });

  it("marks the job and request failed and keeps retry available when the AI call fails", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockParse.mockRejectedValueOnce(new Error("Simulated API outage"));

    const digest = await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    expect(digest).toContain(`/app/diagnosticos/${request.id}?erro=`);

    const job = (harness.store.analysis_jobs ?? [])[0]!;
    expect(job.status).toBe("failed");
    expect(job.error_message).toContain("Simulated API outage");
    expect(job.finished_at).not.toBeNull();

    const updatedRequest = (harness.store.analysis_requests ?? [])[0]!;
    expect(updatedRequest.status).toBe("failed");

    expect(harness.store.analysis_results ?? []).toHaveLength(0);
  });
});
