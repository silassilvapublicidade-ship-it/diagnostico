import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildBusinessFormData,
  captureRedirectDigest,
  resetFakeStore,
} from "../mocks/persistence-harness";
import { seedRow, type FakeStore } from "../mocks/supabase-fake";
import { calculateAnalysisResult } from "@/domain/methodology-8d";
import {
  createDiagnosisFromForm,
  getDiagnosis,
  listDiagnoses,
  persistDevelopmentResult,
} from "@/modules/analysis/persistence";
import {
  buildDevelopmentFixtureResult,
  isDevelopmentFixturesEnabled,
} from "@/modules/analysis/development-fixture";
import { creatorLowEvidenceFixture } from "../fixtures/creator_low_evidence";

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

vi.mock("@/modules/analysis/development-fixture", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/modules/analysis/development-fixture")
    >();
  return {
    ...actual,
    buildDevelopmentFixtureResult: vi.fn(actual.buildDevelopmentFixtureResult),
  };
});

describe("ownership cannot be forged from the browser", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    harness.userId = "user-1";
  });

  it("always sources analysis_requests.user_id and analysis_assets.user_id from the session, never from form fields", async () => {
    const formData = buildBusinessFormData();
    formData.set("user_id", "attacker-controlled-id");
    formData.set("userId", "attacker-controlled-id");

    await captureRedirectDigest(createDiagnosisFromForm(formData));

    const request = (harness.store.analysis_requests ?? [])[0]!;
    expect(request.user_id).toBe("user-1");

    const asset = (harness.store.analysis_assets ?? [])[0]!;
    expect(asset.user_id).toBe("user-1");
  });
});

describe("cross-user read isolation", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
  });

  it("never returns another user's diagnosis through getDiagnosis or listDiagnoses", async () => {
    const ownRequest = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      profile_type: "business",
      status: "ready",
      requires_review: false,
      review_reasons: [],
    });
    const otherRequest = seedRow(harness.store, "analysis_requests", {
      user_id: "user-2",
      profile_type: "creator",
      status: "ready",
      requires_review: false,
      review_reasons: [],
    });

    harness.userId = "user-1";

    const list = await listDiagnoses();
    expect(list.map((row) => row.id)).toEqual([ownRequest.id]);

    const ownDetail = await getDiagnosis(ownRequest.id as string);
    expect(ownDetail).not.toBeNull();

    const otherDetail = await getDiagnosis(otherRequest.id as string);
    expect(otherDetail).toBeNull();
  });

  it("hides a requires_review result and a deleted asset even from the request's own owner", async () => {
    const ownRequest = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      profile_type: "business",
      status: "requires_review",
      requires_review: true,
      review_reasons: ["fewer_than_5_evaluable_dimensions"],
    });
    seedRow(harness.store, "analysis_results", {
      analysis_request_id: ownRequest.id,
      analysis_job_id: "job-x",
      result_sequence: 1,
      score_kind: "partial",
      score: 45,
      confidence: "low",
      requires_review: true,
      review_reasons: ["fewer_than_5_evaluable_dimensions"],
      result_origin: "development_fixture",
    });
    seedRow(harness.store, "analysis_assets", {
      analysis_request_id: ownRequest.id,
      user_id: "user-1",
      asset_type: "profile_top",
      mime_type: "image/png",
      file_size_bytes: 10,
      deleted_at: new Date().toISOString(),
    });

    harness.userId = "user-1";

    const detail = await getDiagnosis(ownRequest.id as string);
    expect(detail).not.toBeNull();
    // Mirrors the analysis_results_select_own_result and
    // analysis_assets_select_own_request RLS policies in
    // supabase/migrations/0001_initial_schema.sql: a result stays hidden
    // from the customer role while requires_review is true, and a
    // soft-deleted asset is never listed, even for the request's owner.
    expect(detail?.result).toBeNull();
    expect(detail?.assets).toHaveLength(0);
  });
});

describe("service role stays server-only", () => {
  it("gates the admin Supabase client behind the server-only import", () => {
    const adminSource = readFileSync(
      new URL("../../src/lib/supabase/admin.ts", import.meta.url),
      "utf8",
    );

    expect(adminSource).toContain('import "server-only"');
  });

  it("is never imported from a client component", () => {
    const srcDir = fileURLToPath(new URL("../../src", import.meta.url));
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) {
          continue;
        }
        const content = readFileSync(fullPath, "utf8");
        if (
          content.includes('"use client"') &&
          content.includes("@/lib/supabase/admin")
        ) {
          offenders.push(fullPath);
        }
      }
    };

    walk(srcDir);

    expect(offenders).toEqual([]);
  });
});

describe("development fixture gate", () => {
  it("stays closed unless NODE_ENV=development AND the flag are both explicitly set", () => {
    expect(
      isDevelopmentFixturesEnabled({
        NODE_ENV: "production",
        ENABLE_DEVELOPMENT_FIXTURES: "true",
      }),
    ).toBe(false);
    expect(
      isDevelopmentFixturesEnabled({
        NODE_ENV: "development",
        ENABLE_DEVELOPMENT_FIXTURES: "false",
      }),
    ).toBe(false);
    expect(
      isDevelopmentFixturesEnabled({
        NODE_ENV: "development",
        ENABLE_DEVELOPMENT_FIXTURES: "true",
      }),
    ).toBe(true);
  });
});

describe("requires_review can never become an automatically available report", () => {
  beforeEach(() => {
    resetFakeStore(harness.store);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEVELOPMENT_FIXTURES", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists a blocked report with no web_payload when the generated result requires review", async () => {
    vi.mocked(buildDevelopmentFixtureResult).mockReturnValueOnce({
      origin: "development_fixture",
      fixtureKind: "creator_low_evidence",
      result: calculateAnalysisResult(creatorLowEvidenceFixture),
    });

    const request = seedRow(harness.store, "analysis_requests", {
      user_id: "user-1",
      profile_type: "creator",
      status: "processing",
    });
    const job = seedRow(harness.store, "analysis_jobs", {
      analysis_request_id: request.id,
      status: "processing",
    });

    await persistDevelopmentResult({
      analysisRequestId: request.id as string,
      analysisJobId: job.id as string,
      profileType: "creator",
    });

    const result = (harness.store.analysis_results ?? [])[0]!;
    expect(result.requires_review).toBe(true);

    const report = (harness.store.analysis_reports ?? [])[0]!;
    expect(report.status).toBe("blocked");
    expect(report.web_payload).toBeNull();

    const updatedRequest = (harness.store.analysis_requests ?? []).find(
      (row) => row.id === request.id,
    );
    expect(updatedRequest?.status).toBe("waiting_for_more_information");
    expect(updatedRequest?.requires_review).toBe(true);
  });
});
