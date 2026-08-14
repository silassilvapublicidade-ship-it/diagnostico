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

const mockFinalMessage = vi.hoisted(() => vi.fn());
const mockStream = vi.hoisted(() =>
  vi.fn<
    (params: Record<string, unknown>) => {
      finalMessage: typeof mockFinalMessage;
    }
  >(() => ({ finalMessage: mockFinalMessage })),
);

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
  createAnthropicClient: () => ({ messages: { stream: mockStream } }),
  getAnthropicModel: () => aiClientHarness.model,
}));

const BUCKET = "analysis-assets";

function seedPaidOrder(store: FakeStore, ownerId: string) {
  const order = seedRow(store, "orders", {
    user_id: ownerId,
    status: "paid",
    amount_cents: 999,
    currency: "BRL",
  });
  seedRow(store, "payments", {
    order_id: order.id,
    status: "approved",
    amount_cents: 999,
    currency: "BRL",
  });
  return order;
}

function seedRequestWithAsset(
  store: FakeStore,
  ownerId: string,
  extra: Record<string, unknown> = {},
) {
  // Every test in this file predates the payment gate and exercises
  // something else (ownership, retries, persistence) -- default to an
  // already-paid order so those tests keep testing what they always
  // tested. Gate-specific tests opt out by passing order_id explicitly
  // (including `order_id: null`) via extra.
  const order = "order_id" in extra ? null : seedPaidOrder(store, ownerId);

  const request = seedRow(store, "analysis_requests", {
    user_id: ownerId,
    profile_type: "business",
    instagram_url: "https://instagram.com/acme",
    status: "ready",
    order_id: order?.id ?? null,
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

function mockSuccessfulResponse() {
  mockFinalMessage.mockResolvedValueOnce({
    stop_reason: "end_turn",
    stop_details: null,
    usage: { input_tokens: 4200, output_tokens: 1800 },
    content: [{ type: "text", text: JSON.stringify(aiOutputBusinessComplete) }],
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
  mockStream.mockClear();
  mockFinalMessage.mockReset();
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
    expect(mockStream).not.toHaveBeenCalled();
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
    expect(mockStream).not.toHaveBeenCalled();
  });

  it("maps a successful structured response into a domain result, web payload, and usage", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulResponse();

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
    mockSuccessfulResponse();

    await generateAiDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
    });

    const callArgs = mockStream.mock.calls[0]![0] as {
      thinking: unknown;
      output_config: { effort?: string };
    };
    expect(callArgs.thinking).toEqual({ type: "adaptive" });
    expect(callArgs.output_config.effort).toBe("medium");
  });

  it("uses extended thinking without effort for an extended-only model (claude-haiku-4-5-20251001)", async () => {
    aiClientHarness.model = "claude-haiku-4-5-20251001";
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulResponse();

    await generateAiDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
    });

    const callArgs = mockStream.mock.calls[0]![0] as {
      thinking: unknown;
      output_config: { effort?: string };
    };
    expect(callArgs.thinking).toEqual({
      type: "enabled",
      budget_tokens: 4000,
    });
    expect(callArgs.output_config.effort).toBeUndefined();
  });

  it("treats stop_reason 'refusal' as a job failure, never a persisted result", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockFinalMessage.mockResolvedValueOnce({
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
    mockFinalMessage.mockResolvedValueOnce({
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

  it("treats output that fails schema validation as a job failure, not a thrown SDK exception", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    const invalidOutput = {
      ...aiOutputBusinessComplete,
      dimensions: aiOutputBusinessComplete.dimensions.slice(0, 6),
    };
    mockFinalMessage.mockResolvedValueOnce({
      stop_reason: "end_turn",
      stop_details: null,
      usage: { input_tokens: 100, output_tokens: 50 },
      content: [{ type: "text", text: JSON.stringify(invalidOutput) }],
    });

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-1",
      }),
    ).rejects.toThrow(/schema esperado/);
  });

  it("treats unparseable JSON text as a job failure with a clear message", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockFinalMessage.mockResolvedValueOnce({
      stop_reason: "end_turn",
      stop_details: null,
      usage: { input_tokens: 100, output_tokens: 50 },
      content: [{ type: "text", text: "not valid json" }],
    });

    await expect(
      generateAiDiagnosis({
        requestId: request.id as string,
        userId: "user-1",
      }),
    ).rejects.toThrow(/JSON valido/);
  });

  it("drops duplicate and unrecognized dimension entries instead of failing the whole response", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    const duplicatePositioning = aiOutputBusinessComplete.dimensions[0]!;
    const unrecognizedEntry = {
      ...duplicatePositioning,
      dimension: "not_a_real_dimension",
    };
    const outputWithExtras = {
      ...aiOutputBusinessComplete,
      dimensions: [
        ...aiOutputBusinessComplete.dimensions,
        duplicatePositioning,
        unrecognizedEntry,
      ],
    };
    mockFinalMessage.mockResolvedValueOnce({
      stop_reason: "end_turn",
      stop_details: null,
      usage: { input_tokens: 4200, output_tokens: 1800 },
      content: [{ type: "text", text: JSON.stringify(outputWithExtras) }],
    });

    const generated = await generateAiDiagnosis({
      requestId: request.id as string,
      userId: "user-1",
    });

    expect(generated.result.includedDimensions).toHaveLength(8);
    expect(generated.webPayload.executiveSummary).toBe(
      aiOutputBusinessComplete.executive_summary,
    );
  });

  it("still fails when fewer than 8 valid unique dimensions remain after dropping duplicates", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    const outputMissingOne = {
      ...aiOutputBusinessComplete,
      dimensions: [
        ...aiOutputBusinessComplete.dimensions.slice(0, 7),
        aiOutputBusinessComplete.dimensions[0]!,
      ],
    };
    mockFinalMessage.mockResolvedValueOnce({
      stop_reason: "end_turn",
      stop_details: null,
      usage: { input_tokens: 100, output_tokens: 50 },
      content: [{ type: "text", text: JSON.stringify(outputMissingOne) }],
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
    expect(mockStream).not.toHaveBeenCalled();
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
    expect(mockStream).not.toHaveBeenCalled();
  });

  it("creates the first job as attempt 1 with no parent", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulResponse();

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
    mockSuccessfulResponse();

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

  it("persists analysis_results/scores/reports with tokens, never marked as a test analysis once payment is confirmed", async () => {
    const request = seedRequestWithAsset(harness.store, "user-1");
    mockSuccessfulResponse();

    const digest = await captureRedirectDigest(
      runDiagnosisAnalysisAction(buildFormData(request.id as string)),
    );

    expect(digest).toContain(`/app/diagnosticos/${request.id}`);

    const results = harness.store.analysis_results ?? [];
    expect(results).toHaveLength(1);
    expect(results[0]!.result_origin).toBe("ai_generated");
    // assertDiagnosisCanBeProcessed already confirmed payment before this
    // code runs, so this is a real delivery -- the "test" banner must never
    // reach a paying customer.
    expect(results[0]!.is_test_analysis).toBe(false);
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
    mockFinalMessage.mockRejectedValueOnce(new Error("Simulated API outage"));

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

  describe("payment gate", () => {
    it("never reaches generateAiDiagnosis for a request with no order at all", async () => {
      const request = seedRequestWithAsset(harness.store, "user-1", {
        order_id: null,
      });

      const digest = await captureRedirectDigest(
        runDiagnosisAnalysisAction(buildFormData(request.id as string)),
      );

      expect(digest).toContain(`/app/diagnosticos/${request.id}?erro=`);
      expect(harness.store.analysis_jobs ?? []).toHaveLength(0);
      expect(mockStream).not.toHaveBeenCalled();
      expect(harness.store.analysis_results ?? []).toHaveLength(0);
    });

    it("never reaches generateAiDiagnosis when the order is not paid", async () => {
      const order = seedRow(harness.store, "orders", {
        user_id: "user-1",
        status: "pending",
        amount_cents: 999,
        currency: "BRL",
      });
      const request = seedRequestWithAsset(harness.store, "user-1", {
        order_id: order.id,
      });

      await captureRedirectDigest(
        runDiagnosisAnalysisAction(buildFormData(request.id as string)),
      );

      expect(mockStream).not.toHaveBeenCalled();
      expect(harness.store.analysis_jobs ?? []).toHaveLength(0);
    });

    it("blocks a payment approved for a different diagnosis from unlocking this one", async () => {
      // A second, fully-paid diagnosis exists for the same user.
      seedRequestWithAsset(harness.store, "user-1");

      // This diagnosis has no order of its own.
      const request = seedRequestWithAsset(harness.store, "user-1", {
        order_id: null,
      });

      await captureRedirectDigest(
        runDiagnosisAnalysisAction(buildFormData(request.id as string)),
      );

      expect(mockStream).not.toHaveBeenCalled();
    });

    it("allows processing once the order is paid with a consistent approved payment", async () => {
      const request = seedRequestWithAsset(harness.store, "user-1");
      mockSuccessfulResponse();

      const digest = await captureRedirectDigest(
        runDiagnosisAnalysisAction(buildFormData(request.id as string)),
      );

      expect(digest).toContain(`/app/diagnosticos/${request.id}`);
      expect(digest).not.toContain("erro=");
      expect(mockStream).toHaveBeenCalledTimes(1);
      expect(harness.store.analysis_results ?? []).toHaveLength(1);
    });

    it("an allowlisted test account skips the gate entirely, even with no order at all", async () => {
      // isPaymentBypassTestAccount is not mocked here, so it makes a real
      // getServerEnv() call -- needs its own required env vars stubbed.
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
      vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
      vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
      vi.stubEnv("PAYMENT_BYPASS_TEST_EMAILS", "bypass-user@example.com");
      harness.userId = "bypass-user";
      const request = seedRequestWithAsset(harness.store, "bypass-user", {
        order_id: null,
      });
      mockSuccessfulResponse();

      const digest = await captureRedirectDigest(
        runDiagnosisAnalysisAction(buildFormData(request.id as string)),
      );

      expect(digest).toContain(`/app/diagnosticos/${request.id}`);
      expect(digest).not.toContain("erro=");
      expect(mockStream).toHaveBeenCalledTimes(1);
    });

    it("a non-allowlisted account with the same missing order is still blocked", async () => {
      vi.stubEnv("PAYMENT_BYPASS_TEST_EMAILS", "bypass-user@example.com");
      // "user-1" (the default harness identity) is deliberately not on the
      // allowlist -- confirms the bypass never leaks beyond the exact
      // configured email.
      const request = seedRequestWithAsset(harness.store, "user-1", {
        order_id: null,
      });

      await captureRedirectDigest(
        runDiagnosisAnalysisAction(buildFormData(request.id as string)),
      );

      expect(mockStream).not.toHaveBeenCalled();
    });
  });
});
