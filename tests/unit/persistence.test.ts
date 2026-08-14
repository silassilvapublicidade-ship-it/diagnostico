import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildBusinessFormData,
  buildCreatorFormData,
  captureRedirectDigest,
  resetFakeStore,
} from "../mocks/persistence-harness";
import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import {
  completePreparedDiagnosisUpload,
  createDiagnosisFromForm,
  getDiagnosis,
  getNextResultSequence,
  listDiagnoses,
  persistDevelopmentResult,
  prepareDiagnosisUploadFromForm,
} from "@/modules/analysis/persistence";

const harness = vi.hoisted(() => ({
  store: {} as FakeStore,
  userId: "user-1" as string | null,
}));

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

// This module makes a real network call by design (see its own doc
// comment) -- never let a unit test touch the real network. Its behavior is
// covered on its own in profile-photo.test.ts.
vi.mock("@/modules/analysis/profile-photo", () => ({
  fetchAndStoreProfilePhotoBestEffort: vi.fn(async () => {}),
}));

describe("createDiagnosisFromForm", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    harness.userId = "user-1";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists request, answers, assets, and a ready job when fixtures are disabled", async () => {
    const digest = await captureRedirectDigest(
      createDiagnosisFromForm(buildBusinessFormData()),
    );

    const requests = harness.store.analysis_requests ?? [];
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(digest).toContain(`/app/diagnosticos/${request.id}`);
    expect(request.user_id).toBe("user-1");
    expect(request.profile_type).toBe("business");
    expect(request.status).toBe("waiting_payment");

    const answers = harness.store.analysis_answers ?? [];
    expect(answers.length).toBeGreaterThan(0);
    expect(answers.every((row) => row.analysis_request_id === request.id)).toBe(
      true,
    );
    expect(answers.map((row) => row.question_key)).toEqual(
      expect.arrayContaining(["niche", "mainObjective", "mainDifficulty"]),
    );

    const assets = harness.store.analysis_assets ?? [];
    expect(assets).toHaveLength(1);
    expect(assets[0]!.user_id).toBe("user-1");
    expect(assets[0]!.asset_type).toBe("profile_top");
    expect(harness.store.__storage).toHaveLength(1);

    const jobs = harness.store.analysis_jobs ?? [];
    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.status).toBe("ready");
    expect(jobs[0]!.trigger_reason).toBe("initial_submission");

    expect(harness.store.analysis_results ?? []).toHaveLength(0);
  });

  it("persists a creator briefing with the same simplified answers", async () => {
    await captureRedirectDigest(
      createDiagnosisFromForm(buildCreatorFormData()),
    );

    const requests = harness.store.analysis_requests ?? [];
    expect(requests).toHaveLength(1);
    expect(requests[0]!.profile_type).toBe("creator");

    const answers = harness.store.analysis_answers ?? [];
    expect(answers.map((row) => row.question_key)).toEqual(
      expect.arrayContaining(["niche", "mainObjective", "mainDifficulty"]),
    );
  });

  it("redirects with an error and writes nothing when the briefing is invalid", async () => {
    const digest = await captureRedirectDigest(
      createDiagnosisFromForm(buildBusinessFormData({ mainObjective: [] })),
    );

    expect(digest).toContain("/app/diagnosticos/novo?erro=");
    expect(harness.store.analysis_requests ?? []).toHaveLength(0);
  });

  it("redirects with an error and writes nothing when no evidence file is sent", async () => {
    const formData = buildBusinessFormData();
    formData.delete("asset_profile_top");

    const digest = await captureRedirectDigest(
      createDiagnosisFromForm(formData),
    );

    expect(digest).toContain("/app/diagnosticos/novo?erro=");
    expect(harness.store.analysis_requests ?? []).toHaveLength(0);
  });

  it("runs the development fixture end to end when explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEVELOPMENT_FIXTURES", "true");

    const digest = await captureRedirectDigest(
      createDiagnosisFromForm(buildBusinessFormData()),
    );

    const request = (harness.store.analysis_requests ?? [])[0]!;
    expect(digest).toContain(`/app/diagnosticos/${request.id}`);
    expect(request.status).toBe("completed");
    expect(request.requires_review).toBe(false);
    expect(request.completed_at).not.toBeNull();

    const job = (harness.store.analysis_jobs ?? [])[0]!;
    expect(job.status).toBe("completed");
    expect(job.finished_at).not.toBeNull();
    expect(job.trigger_reason).toBe("development_fixture");

    const results = harness.store.analysis_results ?? [];
    expect(results).toHaveLength(1);
    expect(results[0]!.result_origin).toBe("development_fixture");
    expect(results[0]!.score).toBe(58);
    expect(results[0]!.result_sequence).toBe(1);

    expect(harness.store.analysis_scores ?? []).toHaveLength(8);

    const reports = harness.store.analysis_reports ?? [];
    expect(reports).toHaveLength(1);
    expect(reports[0]!.status).toBe("available");
    expect(reports[0]!.web_payload).toMatchObject({ score: 58 });
  });

  it("never runs the development fixture unless NODE_ENV=development AND the flag are both set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEVELOPMENT_FIXTURES", "true");

    await captureRedirectDigest(
      createDiagnosisFromForm(buildBusinessFormData()),
    );

    const request = (harness.store.analysis_requests ?? [])[0]!;
    expect(request.status).toBe("waiting_payment");
    expect(harness.store.analysis_results ?? []).toHaveLength(0);
  });

  it("marks the request and the already-created job as failed, and keeps the orphaned result identifiable, when a later insert fails mid-flow", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEVELOPMENT_FIXTURES", "true");
    harness.store.__insertFaults = {
      analysis_scores: "simulated scores insert failure",
    };

    const digest = await captureRedirectDigest(
      createDiagnosisFromForm(buildBusinessFormData()),
    );

    expect(digest).toContain("/app/diagnosticos/novo?erro=");

    const request = (harness.store.analysis_requests ?? [])[0]!;
    expect(request.status).toBe("failed");

    const job = (harness.store.analysis_jobs ?? [])[0]!;
    expect(job.status).toBe("failed");
    expect(job.error_message).toContain("simulated scores insert failure");
    expect(job.finished_at).not.toBeNull();

    // Phase 2A has no cross-table transaction: the analysis_results row
    // inserted just before the failure is not rolled back. This is the
    // documented partial-write risk (see docs/database.md). What matters is
    // that it stays identifiable as orphaned rather than silently lost or
    // stuck at "processing": both its job and its request are explicitly
    // "failed", and analysis_scores/analysis_reports were never written for
    // it, so a future reconciliation job can find it by that signature.
    const results = harness.store.analysis_results ?? [];
    expect(results).toHaveLength(1);
    expect(results[0]!.result_origin).toBe("development_fixture");
    expect(harness.store.analysis_scores ?? []).toHaveLength(0);
    expect(harness.store.analysis_reports ?? []).toHaveLength(0);
  });
});

describe("direct browser evidence upload flow", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    harness.userId = "user-1";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prepares signed uploads, then records uploaded evidence without sending file bytes through the server action", async () => {
    const metadata = buildBusinessFormData();
    metadata.delete("asset_profile_top");

    const prepared = await prepareDiagnosisUploadFromForm(metadata, [
      {
        assetType: "profile_top",
        name: "print-celular.jpg",
        type: "image/jpeg",
        size: 4 * 1024 * 1024,
      },
    ]);

    const request = (harness.store.analysis_requests ?? [])[0]!;
    expect(request.status).toBe("waiting_assets");
    expect(prepared.uploads).toHaveLength(1);
    expect(prepared.uploads[0]!.token).toBe("fake-token");
    expect(harness.store.analysis_assets ?? []).toHaveLength(0);

    harness.store.__storage = [
      {
        bucket: prepared.uploads[0]!.storageBucket,
        path: prepared.uploads[0]!.storagePath,
      },
    ];

    const completed = await completePreparedDiagnosisUpload({
      requestId: prepared.requestId,
      assets: prepared.uploads.map((upload) => ({
        assetType: upload.assetType,
        storageBucket: upload.storageBucket,
        storagePath: upload.storagePath,
        originalFilename: upload.originalFilename,
        mimeType: upload.mimeType,
        fileSizeBytes: upload.fileSizeBytes,
      })),
    });

    expect(completed.redirectTo).toBe(
      `/app/diagnosticos/${prepared.requestId}`,
    );

    const updatedRequest = (harness.store.analysis_requests ?? [])[0]!;
    expect(updatedRequest.status).toBe("waiting_payment");

    const assets = harness.store.analysis_assets ?? [];
    expect(assets).toHaveLength(1);
    expect(assets[0]!.user_id).toBe("user-1");
    expect(assets[0]!.metadata).toMatchObject({
      source: "direct_browser_upload",
    });

    const jobs = harness.store.analysis_jobs ?? [];
    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.status).toBe("ready");
  });

  it("skips straight to ready (no waiting_payment) for an allowlisted test account", async () => {
    // isPaymentBypassTestAccount is not mocked in this file (unlike
    // createSupabaseAdminClient/createSupabaseServerClient), so it makes a
    // real getServerEnv() call -- needs its own required env vars stubbed.
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("PAYMENT_BYPASS_TEST_EMAILS", "user-1@example.com");

    const metadata = buildBusinessFormData();
    metadata.delete("asset_profile_top");

    const prepared = await prepareDiagnosisUploadFromForm(metadata, [
      {
        assetType: "profile_top",
        name: "print-celular.jpg",
        type: "image/jpeg",
        size: 4 * 1024 * 1024,
      },
    ]);

    harness.store.__storage = [
      {
        bucket: prepared.uploads[0]!.storageBucket,
        path: prepared.uploads[0]!.storagePath,
      },
    ];

    await completePreparedDiagnosisUpload({
      requestId: prepared.requestId,
      assets: prepared.uploads.map((upload) => ({
        assetType: upload.assetType,
        storageBucket: upload.storageBucket,
        storagePath: upload.storagePath,
        originalFilename: upload.originalFilename,
        mimeType: upload.mimeType,
        fileSizeBytes: upload.fileSizeBytes,
      })),
    });

    const updatedRequest = (harness.store.analysis_requests ?? [])[0]!;
    expect(updatedRequest.status).toBe("ready");
  });
});

describe("getNextResultSequence", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("starts at 1 for a request with no prior results", async () => {
    await expect(getNextResultSequence("request-a")).resolves.toBe(1);
  });

  it("increments per existing result so a retry never overwrites history", async () => {
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: "request-a",
      result_sequence: 1,
    });

    await expect(getNextResultSequence("request-a")).resolves.toBe(2);
  });
});

describe("persistDevelopmentResult retried for the same request", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEVELOPMENT_FIXTURES", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps every prior result instead of overwriting it on a second attempt", async () => {
    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      profile_type: "business",
      status: "processing",
    });
    const firstJob = seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: request.id,
      status: "processing",
    });

    await persistDevelopmentResult({
      analysisRequestId: request.id as string,
      analysisJobId: firstJob.id as string,
      profileType: "business",
    });

    const secondJob = seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: request.id,
      status: "processing",
    });

    await persistDevelopmentResult({
      analysisRequestId: request.id as string,
      analysisJobId: secondJob.id as string,
      profileType: "business",
    });

    const results = harness.store.analysis_results ?? [];
    expect(results).toHaveLength(2);
    expect(results.map((row) => row.result_sequence).sort()).toEqual([1, 2]);
    expect(results[0]!.id).not.toBe(results[1]!.id);
  });
});

describe("listDiagnoses / getDiagnosis", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    harness.userId = "user-1";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists and reads back a diagnosis for its owner", async () => {
    await captureRedirectDigest(
      createDiagnosisFromForm(buildBusinessFormData()),
    );

    const list = await listDiagnoses();
    expect(list).toHaveLength(1);

    const detail = await getDiagnosis(list[0]!.id);
    expect(detail).not.toBeNull();
    expect(detail?.assets).toHaveLength(1);
  });
});
