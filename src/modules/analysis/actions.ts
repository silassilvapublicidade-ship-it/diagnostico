"use server";

import { redirect } from "next/navigation";

import { type AnalysisStatus } from "@/domain/methodology-8d";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAiDiagnosis } from "@/modules/ai/run-analysis";
import { requireUser } from "@/modules/auth/session";

import {
  createDiagnosisFromForm,
  getNextAttemptNumber,
  persistAnalysisResult,
} from "./persistence";

export async function submitDiagnosisAction(formData: FormData) {
  return createDiagnosisFromForm(formData);
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
  // action analyze someone else's private evidence.
  const { data: request, error: requestError } = await admin
    .from("analysis_requests")
    .select("id, user_id")
    .eq("id", requestId)
    .single();

  if (requestError || !request || request.user_id !== user.id) {
    redirect("/app/diagnosticos");
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
      // No billing exists yet (Fase 2B) — every real AI analysis run today
      // is, by definition, a controlled test rather than a paid delivery.
      isTestAnalysis: true,
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

    redirect(
      `/app/diagnosticos/${requestId}?erro=${encodeURIComponent(errorMessage)}`,
    );
  }

  redirect(`/app/diagnosticos/${requestId}`);
}
