import "server-only";

import { redirect } from "next/navigation";

import {
  resolveFinalAnalysisStatus,
  type AnalysisCalculationResult,
  type AnalysisStatus,
  type ProfileType,
} from "@/domain/methodology-8d";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  collectUploadCandidates,
  getFileAssetType,
  validateUploadCandidates,
  type AssetType,
} from "@/modules/assets/validation";
import { requireUser } from "@/modules/auth/session";

import {
  parseBriefingForm,
  parseProcessingConsent,
  toAnswerRows,
  type DiagnosisBriefing,
} from "./briefing";
import {
  buildDevelopmentFixtureResult,
  isDevelopmentFixturesEnabled,
} from "./development-fixture";
import type { ResultOrigin } from "./result-origin";

const STORAGE_BUCKET = "analysis-assets";
const RETENTION_DAYS = 90;

export type DiagnosisListItem = {
  id: string;
  profile_type: ProfileType;
  status: AnalysisStatus;
  requires_review: boolean;
  created_at: string;
  completed_at: string | null;
};

export type DiagnosisDetail = {
  request: DiagnosisListItem & {
    instagram_url: string | null;
    review_reasons: string[];
  };
  result: {
    id: string;
    result_sequence: number;
    score_kind: "complete" | "partial";
    score: number;
    confidence: "high" | "medium" | "low";
    requires_review: boolean;
    review_reasons: string[];
    methodology_version: string;
    scoring_version: string;
    result_version: string;
    result_origin: ResultOrigin;
    is_test_analysis: boolean;
    normalized_result: unknown;
    generated_at: string;
  } | null;
  report: {
    status: "blocked" | "generating" | "available" | "failed";
    web_payload: unknown;
    blocked_reason: string | null;
    generated_at: string | null;
  } | null;
  assets: Array<{
    id: string;
    asset_type: AssetType;
    original_filename: string | null;
    mime_type: string;
    file_size_bytes: number;
  }>;
};

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function redirectWithError(message: string): never {
  redirect(`/app/diagnosticos/novo?erro=${encodeURIComponent(message)}`);
}

export async function getNextResultSequence(analysisRequestId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("analysis_request_id", analysisRequestId);

  if (error) {
    throw error;
  }

  return (count ?? 0) + 1;
}

export async function getNextAttemptNumber(analysisRequestId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("analysis_request_id", analysisRequestId);

  if (error) {
    throw error;
  }

  return (count ?? 0) + 1;
}

export type PersistAnalysisResultParams = {
  analysisRequestId: string;
  analysisJobId: string;
  result: AnalysisCalculationResult;
  resultOrigin: ResultOrigin;
  rawOutput: unknown;
  webPayload?: unknown;
  isTestAnalysis?: boolean;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    modelDurationMs?: number;
    estimatedCostUsdCents?: number | null;
  };
};

/**
 * Shared by the development-fixture path and the real Anthropic path: inserts
 * an immutable analysis_results row (never overwrites a prior one — see
 * getNextResultSequence), its per-dimension analysis_scores, the
 * analysis_reports row gating premium delivery on requires_review, then
 * updates the job/request status via the same resolveFinalAnalysisStatus
 * used everywhere else.
 */
export async function persistAnalysisResult(
  params: PersistAnalysisResultParams,
) {
  const admin = createSupabaseAdminClient();
  const { result } = params;
  const finalStatus = resolveFinalAnalysisStatus(result);
  const resultSequence = await getNextResultSequence(params.analysisRequestId);

  const { data: analysisResult, error: resultError } = await admin
    .from("analysis_results")
    .insert({
      analysis_request_id: params.analysisRequestId,
      analysis_job_id: params.analysisJobId,
      result_sequence: resultSequence,
      score_kind: result.scoreKind,
      score: result.score,
      confidence: result.confidence,
      requires_review: result.requiresReview,
      review_reasons: result.reviewReasons,
      methodology_version: result.methodologyVersion,
      prompt_version: result.promptVersion,
      scoring_version: result.scoringVersion,
      result_version: result.resultVersion,
      result_origin: params.resultOrigin,
      model_provider: result.modelProvider,
      model_name: result.modelName,
      weights_snapshot: result.weightsSnapshot,
      raw_output: params.rawOutput,
      normalized_result: result,
      generated_at: result.generatedAt,
      input_tokens: params.usage?.inputTokens ?? null,
      output_tokens: params.usage?.outputTokens ?? null,
      model_duration_ms: params.usage?.modelDurationMs ?? null,
      estimated_cost_usd_cents: params.usage?.estimatedCostUsdCents ?? null,
      is_test_analysis: params.isTestAnalysis ?? false,
    })
    .select("id")
    .single();

  if (resultError || !analysisResult) {
    throw resultError ?? new Error("Analysis result was not persisted.");
  }

  const { error: scoresError } = await admin.from("analysis_scores").insert(
    result.dimensionScores.map((dimension) => ({
      analysis_result_id: analysisResult.id,
      dimension: dimension.dimension,
      status: dimension.status,
      score: dimension.score ?? null,
      confidence: dimension.confidence,
      original_weight: dimension.originalWeight,
      effective_weight: dimension.effectiveWeight,
      evidence_summary: {
        available: dimension.evidenceAvailable,
        missing: dimension.evidenceMissing,
      },
      limitations: dimension.limitations,
      recommendations: [dimension.safeRecommendation],
    })),
  );

  if (scoresError) {
    throw scoresError;
  }

  const reportStatus = result.requiresReview ? "blocked" : "available";
  const { error: reportError } = await admin.from("analysis_reports").insert({
    analysis_result_id: analysisResult.id,
    status: reportStatus,
    report_version: "web-initial@0.1.0",
    web_payload: result.requiresReview
      ? null
      : (params.webPayload ?? {
          score: result.score,
          score_kind: result.scoreKind,
          result_origin: params.resultOrigin,
        }),
    blocked_reason: result.requiresReview
      ? "requires_review blocked automatic report delivery"
      : null,
    generated_at: result.requiresReview ? null : result.generatedAt,
  });

  if (reportError) {
    throw reportError;
  }

  const { error: jobError } = await admin
    .from("analysis_jobs")
    .update({
      status: finalStatus,
      finished_at: new Date().toISOString(),
    })
    .eq("id", params.analysisJobId);

  if (jobError) {
    throw jobError;
  }

  const { error: requestError } = await admin
    .from("analysis_requests")
    .update({
      status: finalStatus,
      requires_review: result.requiresReview,
      review_reasons: result.reviewReasons,
      completed_at:
        finalStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", params.analysisRequestId);

  if (requestError) {
    throw requestError;
  }

  return {
    result,
    resultOrigin: params.resultOrigin,
    finalStatus,
  };
}

export async function persistDevelopmentResult(params: {
  analysisRequestId: string;
  analysisJobId: string;
  profileType: ProfileType;
}) {
  const fixture = buildDevelopmentFixtureResult(params.profileType);

  return persistAnalysisResult({
    analysisRequestId: params.analysisRequestId,
    analysisJobId: params.analysisJobId,
    result: fixture.result,
    resultOrigin: fixture.origin,
    rawOutput: {
      origin: fixture.origin,
      fixture_kind: fixture.fixtureKind,
      warning:
        "Development fixture. The deterministic engine did not interpret screenshots or briefing.",
    },
  });
}

async function persistUploads(params: {
  analysisRequestId: string;
  userId: string;
  files: File[];
  processingConsentAt: string;
  retentionUntil: string;
}) {
  const admin = createSupabaseAdminClient();

  for (const file of params.files) {
    const assetType = getFileAssetType(file);
    const storagePath = [
      params.userId,
      params.analysisRequestId,
      assetType,
      `${crypto.randomUUID()}-${sanitizeFileName(file.name) || "asset"}`,
    ].join("/");

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: assetError } = await admin.from("analysis_assets").insert({
      analysis_request_id: params.analysisRequestId,
      user_id: params.userId,
      asset_type: assetType,
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      processing_consent_at: params.processingConsentAt,
      retention_until: params.retentionUntil,
      metadata: {
        source: "private_submission",
      },
    });

    if (assetError) {
      throw assetError;
    }
  }
}

export async function createDiagnosisFromForm(formData: FormData) {
  const user = await requireUser();
  let briefing: DiagnosisBriefing;
  let files: File[];

  try {
    parseProcessingConsent(formData);
    briefing = parseBriefingForm(formData);
    files = collectUploadCandidates(formData);
    validateUploadCandidates(
      files.map((file) => ({
        assetType: getFileAssetType(file),
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    );
  } catch (error) {
    redirectWithError(
      error instanceof Error
        ? error.message
        : "Revise o briefing e as evidencias enviadas.",
    );
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const processingConsentAt = now.toISOString();
  const retentionUntil = addDays(now, RETENTION_DAYS).toISOString();

  const { data: request, error: requestError } = await admin
    .from("analysis_requests")
    .insert({
      user_id: user.id,
      profile_type: briefing.profileType,
      instagram_url: briefing.instagramUrl,
      status: "processing",
      submitted_at: processingConsentAt,
    })
    .select("id")
    .single();

  if (requestError || !request) {
    redirectWithError("Nao foi possivel criar o diagnostico.");
  }

  const fixturesEnabled = isDevelopmentFixturesEnabled(process.env);
  let jobId: string | undefined;

  try {
    const answerRows = toAnswerRows(briefing).map((row) => ({
      analysis_request_id: request.id,
      question_key: row.question_key,
      answer: row.answer,
    }));

    const { error: answersError } = await admin
      .from("analysis_answers")
      .insert(answerRows);

    if (answersError) {
      throw answersError;
    }

    await persistUploads({
      analysisRequestId: request.id,
      userId: user.id,
      files,
      processingConsentAt,
      retentionUntil,
    });

    const { data: job, error: jobError } = await admin
      .from("analysis_jobs")
      .insert({
        analysis_request_id: request.id,
        status: fixturesEnabled ? "processing" : "ready",
        attempt_number: 1,
        trigger_reason: fixturesEnabled
          ? "development_fixture"
          : "initial_submission",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw jobError ?? new Error("Analysis job was not created.");
    }

    jobId = job.id;

    if (fixturesEnabled) {
      await persistDevelopmentResult({
        analysisRequestId: request.id,
        analysisJobId: job.id,
        profileType: briefing.profileType,
      });
    } else {
      const { error: updateError } = await admin
        .from("analysis_requests")
        .update({
          status: "ready" satisfies AnalysisStatus,
        })
        .eq("id", request.id);

      if (updateError) {
        throw updateError;
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Nao foi possivel finalizar o envio.";

    // Phase 2A has no cross-table transaction. A failure here can leave a
    // partially written job/result behind; marking both the request and the
    // job (when it already exists) as failed keeps that inconsistent state
    // identifiable instead of leaving the job stuck at "processing" forever.
    // Reprocessing must always insert a new job/result row rather than
    // mutate this one, so history is never overwritten by a retry.
    await admin
      .from("analysis_requests")
      .update({
        status: "failed",
      })
      .eq("id", request.id);

    if (jobId) {
      await admin
        .from("analysis_jobs")
        .update({
          status: "failed" satisfies AnalysisStatus,
          error_message: errorMessage,
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    redirectWithError(errorMessage);
  }

  redirect(`/app/diagnosticos/${request.id}`);
}

export async function listDiagnoses() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("analysis_requests")
    .select(
      "id, profile_type, status, requires_review, created_at, completed_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as DiagnosisListItem[];
}

export async function getDiagnosis(
  id: string,
): Promise<DiagnosisDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: request, error: requestError } = await supabase
    .from("analysis_requests")
    .select(
      "id, profile_type, instagram_url, status, requires_review, review_reasons, created_at, completed_at",
    )
    .eq("id", id)
    .single();

  if (requestError || !request) {
    return null;
  }

  const { data: results } = await supabase
    .from("analysis_results")
    .select(
      "id, result_sequence, score_kind, score, confidence, requires_review, review_reasons, methodology_version, scoring_version, result_version, result_origin, is_test_analysis, normalized_result, generated_at",
    )
    .eq("analysis_request_id", id)
    .order("result_sequence", { ascending: false })
    .limit(1);

  const latestResult = (results?.[0] ?? null) as DiagnosisDetail["result"];
  let report: DiagnosisDetail["report"] = null;

  if (latestResult) {
    const { data: reports } = await supabase
      .from("analysis_reports")
      .select("status, web_payload, blocked_reason, generated_at")
      .eq("analysis_result_id", latestResult.id)
      .order("created_at", { ascending: false })
      .limit(1);

    report = (reports?.[0] ?? null) as DiagnosisDetail["report"];
  }

  const { data: assets } = await supabase
    .from("analysis_assets")
    .select("id, asset_type, original_filename, mime_type, file_size_bytes")
    .eq("analysis_request_id", id)
    .order("created_at", { ascending: true });

  return {
    request: request as DiagnosisDetail["request"],
    result: latestResult,
    report,
    assets: (assets ?? []) as DiagnosisDetail["assets"],
  };
}
