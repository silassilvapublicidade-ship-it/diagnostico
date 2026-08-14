"use server";

import { redirect, unstable_rethrow } from "next/navigation";

import { type AnalysisStatus } from "@/domain/methodology-8d";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAiDiagnosis } from "@/modules/ai/run-analysis";
import type { UploadCandidate } from "@/modules/assets/validation";
import { requireUser } from "@/modules/auth/session";
import {
  assertDiagnosisCanBeProcessed,
  PaymentRequiredError,
} from "@/modules/billing/gate";

import {
  completePreparedDiagnosisUpload,
  createDiagnosisFromForm,
  getNextAttemptNumber,
  markPreparedDiagnosisUploadFailed,
  persistAnalysisResult,
  prepareDiagnosisUploadFromForm,
  type UploadedAssetConfirmation,
} from "./persistence";

export async function submitDiagnosisAction(formData: FormData) {
  return createDiagnosisFromForm(formData);
}

function safeActionError(error: unknown, fallback: string) {
  unstable_rethrow(error);

  const message = error instanceof Error ? error.message : fallback;
  console.error("[diagnosis-upload]", message);

  return message;
}

export async function prepareDiagnosisUploadAction(
  formData: FormData,
  uploadCandidates: UploadCandidate[],
) {
  try {
    const prepared = await prepareDiagnosisUploadFromForm(
      formData,
      uploadCandidates,
    );

    return {
      ok: true as const,
      data: prepared,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: safeActionError(
        error,
        "Nao foi possivel preparar o envio das evidencias.",
      ),
    };
  }
}

export async function completeDiagnosisUploadAction(params: {
  requestId: string;
  assets: UploadedAssetConfirmation[];
}) {
  try {
    const completed = await completePreparedDiagnosisUpload(params);

    return {
      ok: true as const,
      data: completed,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: safeActionError(
        error,
        "Nao foi possivel finalizar o envio das evidencias.",
      ),
    };
  }
}

export async function markDiagnosisUploadFailedAction(params: {
  requestId: string;
  errorMessage: string;
}) {
  try {
    await markPreparedDiagnosisUploadFailed(params);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[diagnosis-upload] failed to mark upload as failed", error);
  }
}

export async function runDiagnosisAnalysisAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    redirect("/app/diagnosticos");
  }

  const user = await requireUser();
  const admin = createSupabaseAdminClient();

  // Ownership is checked explicitly here (not via RLS): this write path uses
  // the service-role client, which bypasses RLS by design. Without this
  // check a crafted requestId from another user's diagnosis would let this
  // action analyze someone else's private evidence. This also keeps a
  // non-owner's redirect generic (the list page, never revealing whether
  // requestId exists) -- the payment gate below only runs once ownership
  // is already confirmed, so its own redirect can safely be specific.
  const { data: request, error: requestError } = await admin
    .from("analysis_requests")
    .select("id, user_id")
    .eq("id", requestId)
    .single();

  if (requestError || !request || request.user_id !== user.id) {
    redirect("/app/diagnosticos");
  }

  // The payment gate is the single, centralized authorization check for
  // this action -- it re-derives ownership, order, and payment state
  // entirely server-side (see assertDiagnosisCanBeProcessed's own doc
  // comment). This must run before any other branch that could reach
  // generateAiDiagnosis; it is intentionally not just a UI-level check,
  // since this Server Action is directly callable regardless of what the
  // page renders.
  try {
    await assertDiagnosisCanBeProcessed(requestId, user.id);
  } catch (error) {
    if (error instanceof PaymentRequiredError) {
      console.error(
        `[billing] blocked analysis for request ${requestId}:`,
        error.message,
      );
      redirect(
        `/app/diagnosticos/${requestId}?erro=${encodeURIComponent(
          "Pagamento necessario para liberar esta analise.",
        )}`,
      );
    }
    throw error;
  }

  const { count: processingCount, error: processingError } = await admin
    .from("analysis_jobs")
    .select("id", { count: "exact", head: true })
    .eq("analysis_request_id", requestId)
    .eq("status", "processing");

  if (processingError) {
    throw processingError;
  }

  if ((processingCount ?? 0) > 0) {
    // A job is already running for this request; avoid a duplicate
    // Anthropic call and a race over which result becomes "latest".
    redirect(`/app/diagnosticos/${requestId}`);
  }

  const { data: recentJobs } = await admin
    .from("analysis_jobs")
    .select("id")
    .eq("analysis_request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(1);

  const parentJobId = recentJobs?.[0]?.id ?? null;
  const attemptNumber = await getNextAttemptNumber(requestId);

  const { data: job, error: jobError } = await admin
    .from("analysis_jobs")
    .insert({
      analysis_request_id: requestId,
      parent_job_id: parentJobId,
      status: "processing" satisfies AnalysisStatus,
      attempt_number: attemptNumber,
      trigger_reason: parentJobId ? "retry" : "manual_analysis",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) {
    throw jobError ?? new Error("Analysis job was not created.");
  }

  await admin
    .from("analysis_requests")
    .update({ status: "processing" satisfies AnalysisStatus })
    .eq("id", requestId);

  try {
    const generated = await generateAiDiagnosis({ requestId, userId: user.id });

    await persistAnalysisResult({
      analysisRequestId: requestId,
      analysisJobId: job.id,
      result: generated.result,
      resultOrigin: "ai_generated",
      rawOutput: generated.rawOutput,
      webPayload: generated.webPayload,
      // assertDiagnosisCanBeProcessed above already confirmed this request
      // is paid before any of this code runs, so this is a real delivery,
      // not a controlled test -- the "test" banner must never reach a
      // paying customer.
      isTestAnalysis: false,
      usage: generated.usage,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Nao foi possivel concluir a analise.";

    // Same partial-failure pattern as createDiagnosisFromForm: mark both the
    // job and the request failed so the state is identifiable and "Tentar
    // novamente" stays available, instead of leaving the job stuck at
    // "processing" with no explanation.
    await admin
      .from("analysis_jobs")
      .update({
        status: "failed" satisfies AnalysisStatus,
        error_message: errorMessage,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await admin
      .from("analysis_requests")
      .update({ status: "failed" satisfies AnalysisStatus })
      .eq("id", requestId);

    // The customer never sees the raw technical error (schema validation
    // dumps, SDK internals): the full detail stays in
    // analysis_jobs.error_message for debugging, and only a short, generic
    // message reaches the redirect.
    redirect(
      `/app/diagnosticos/${requestId}?erro=${encodeURIComponent(
        "Nao foi possivel concluir esta analise agora. Voce pode tentar novamente.",
      )}`,
    );
  }

  redirect(`/app/diagnosticos/${requestId}`);
}
