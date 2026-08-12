import "server-only";

import type {
  AnalysisCalculationResult,
  AnalysisStatus,
  ProfileType,
  ReviewReason,
} from "@/domain/methodology-8d";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ResultOrigin } from "@/modules/analysis/result-origin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_PAGE_SIZE = 20;

export type DiagnosticsFilter = {
  status?: AnalysisStatus | undefined;
  requiresReview?: boolean | undefined;
  reprocessed?: boolean | undefined;
  profileType?: ProfileType | undefined;
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

export type AdminDiagnosticListRow = {
  id: string;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userFullName: string | null;
  instagramUrl: string | null;
  profileType: ProfileType;
  status: AnalysisStatus;
  requiresReview: boolean;
  score: number | null;
  modelName: string | null;
  promptVersion: string | null;
  totalTokens: number | null;
  durationMs: number | null;
  estimatedCostUsdCents: number | null;
  attemptCount: number;
};

export type DiagnosticsPage = {
  rows: AdminDiagnosticListRow[];
  total: number;
  page: number;
  pageSize: number;
};

type RequestRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  instagram_url: string | null;
  profile_type: ProfileType;
  status: AnalysisStatus;
  requires_review: boolean;
};

type LatestResultRow = {
  analysis_request_id: string;
  result_sequence: number;
  score: number;
  model_name: string;
  prompt_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  model_duration_ms: number | null;
  estimated_cost_usd_cents: number | null;
};

function latestByRequest<T extends { analysis_request_id: string; result_sequence: number }>(
  rows: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const current = map.get(row.analysis_request_id);
    if (!current || row.result_sequence > current.result_sequence) {
      map.set(row.analysis_request_id, row);
    }
  }
  return map;
}

/**
 * Resolves a free-text search term into a set of candidate
 * analysis_requests.id values -- an exact id, an Instagram URL substring,
 * or a customer name/email substring (via public.profiles, synced from
 * auth.users by migration 0006). No cross-table OR is needed: each branch
 * is a single simple filter, merged here instead.
 */
async function resolveSearchRequestIds(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  search: string,
): Promise<Set<string> | null> {
  const term = search.trim();
  if (!term) {
    return null;
  }

  if (UUID_PATTERN.test(term)) {
    return new Set([term]);
  }

  const pattern = `%${term}%`;
  const [byInstagram, byName, byEmail] = await Promise.all([
    admin.from("analysis_requests").select("id").ilike("instagram_url", pattern),
    admin.from("profiles").select("id").ilike("full_name", pattern),
    admin.from("profiles").select("id").ilike("email", pattern),
  ]);

  const matchedUserIds = [
    ...((byName.data ?? []) as { id: string }[]),
    ...((byEmail.data ?? []) as { id: string }[]),
  ].map((row) => row.id);

  const ids = new Set<string>(
    ((byInstagram.data ?? []) as { id: string }[]).map((row) => row.id),
  );

  if (matchedUserIds.length > 0) {
    const { data: byUser } = await admin
      .from("analysis_requests")
      .select("id")
      .in("user_id", matchedUserIds);
    for (const row of (byUser ?? []) as { id: string }[]) {
      ids.add(row.id);
    }
  }

  return ids;
}

async function resolveReprocessedRequestIds(
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<Set<string>> {
  const { data } = await admin
    .from("analysis_jobs")
    .select("analysis_request_id")
    .gte("attempt_number", 2);
  return new Set(
    ((data ?? []) as { analysis_request_id: string }[]).map(
      (row) => row.analysis_request_id,
    ),
  );
}

export async function listDiagnosticsForAdmin(
  filter: DiagnosticsFilter = {},
): Promise<DiagnosticsPage> {
  const admin = createSupabaseAdminClient();
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? DEFAULT_PAGE_SIZE));

  let query = admin
    .from("analysis_requests")
    .select(
      "id, created_at, user_id, instagram_url, profile_type, status, requires_review",
      { count: "exact" },
    );

  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (filter.requiresReview != null) {
    query = query.eq("requires_review", filter.requiresReview);
  }
  if (filter.profileType) {
    query = query.eq("profile_type", filter.profileType);
  }

  const [searchIds, reprocessedIds] = await Promise.all([
    filter.search ? resolveSearchRequestIds(admin, filter.search) : Promise.resolve(null),
    filter.reprocessed ? resolveReprocessedRequestIds(admin) : Promise.resolve(null),
  ]);

  if (searchIds) {
    query = query.in("id", [...searchIds]);
  }
  if (reprocessedIds) {
    query = query.in("id", [...reprocessedIds]);
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    throw error;
  }

  const requests = (data ?? []) as RequestRow[];
  const requestIds = requests.map((row) => row.id);
  const userIds = [...new Set(requests.map((row) => row.user_id).filter((id): id is string => id != null))];

  const [resultsRes, jobsRes, profilesRes] = await Promise.all([
    requestIds.length > 0
      ? admin
          .from("analysis_results")
          .select(
            "analysis_request_id, result_sequence, score, model_name, prompt_version, input_tokens, output_tokens, model_duration_ms, estimated_cost_usd_cents",
          )
          .in("analysis_request_id", requestIds)
      : Promise.resolve({ data: [] as LatestResultRow[] }),
    requestIds.length > 0
      ? admin
          .from("analysis_jobs")
          .select("analysis_request_id, attempt_number")
          .in("analysis_request_id", requestIds)
      : Promise.resolve({ data: [] as { analysis_request_id: string; attempt_number: number }[] }),
    userIds.length > 0
      ? admin.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
  ]);

  const latestResults = latestByRequest((resultsRes.data ?? []) as LatestResultRow[]);
  const attemptCounts = new Map<string, number>();
  for (const job of (jobsRes.data ?? []) as { analysis_request_id: string; attempt_number: number }[]) {
    attemptCounts.set(
      job.analysis_request_id,
      Math.max(attemptCounts.get(job.analysis_request_id) ?? 0, job.attempt_number),
    );
  }
  const profileById = new Map(
    ((profilesRes.data ?? []) as { id: string; full_name: string | null; email: string | null }[]).map(
      (row) => [row.id, row],
    ),
  );

  const rows: AdminDiagnosticListRow[] = requests.map((request) => {
    const result = latestResults.get(request.id);
    const profile = request.user_id ? profileById.get(request.user_id) : undefined;
    const totalTokens =
      result && (result.input_tokens != null || result.output_tokens != null)
        ? (result.input_tokens ?? 0) + (result.output_tokens ?? 0)
        : null;

    return {
      id: request.id,
      createdAt: request.created_at,
      userId: request.user_id,
      userEmail: profile?.email ?? null,
      userFullName: profile?.full_name ?? null,
      instagramUrl: request.instagram_url,
      profileType: request.profile_type,
      status: request.status,
      requiresReview: request.requires_review,
      score: result?.score ?? null,
      modelName: result?.model_name ?? null,
      promptVersion: result?.prompt_version ?? null,
      totalTokens,
      durationMs: result?.model_duration_ms ?? null,
      estimatedCostUsdCents: result?.estimated_cost_usd_cents ?? null,
      attemptCount: attemptCounts.get(request.id) ?? 1,
    };
  });

  return { rows, total: count ?? 0, page, pageSize };
}

export type AdminDiagnosisDetail = {
  request: {
    id: string;
    createdAt: string;
    submittedAt: string | null;
    completedAt: string | null;
    status: AnalysisStatus;
    requiresReview: boolean;
    reviewReasons: ReviewReason[];
    profileType: ProfileType;
    instagramUrl: string | null;
    userId: string | null;
    userEmail: string | null;
    userFullName: string | null;
  };
  briefing: {
    niche: string | null;
    mainObjective: string[];
    mainDifficulty: string[];
  };
  assets: Array<{
    id: string;
    assetType: string;
    originalFilename: string | null;
    mimeType: string;
    fileSizeBytes: number;
    createdAt: string;
  }>;
  jobs: Array<{
    id: string;
    status: AnalysisStatus;
    attemptNumber: number;
    parentJobId: string | null;
    triggerReason: string;
    errorMessage: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string;
  }>;
  latestResult:
    | {
        id: string;
        resultSequence: number;
        scoreKind: "complete" | "partial";
        confidence: "high" | "medium" | "low";
        requiresReview: boolean;
        reviewReasons: ReviewReason[];
        methodologyVersion: string;
        promptVersion: string;
        scoringVersion: string;
        resultVersion: string;
        modelProvider: string;
        modelName: string;
        inputTokens: number | null;
        outputTokens: number | null;
        modelDurationMs: number | null;
        estimatedCostUsdCents: number | null;
        resultOrigin: ResultOrigin;
        isTestAnalysis: boolean;
        generatedAt: string;
        normalizedResult: AnalysisCalculationResult;
      }
    | null;
  report: {
    status: "blocked" | "generating" | "available" | "failed";
    webPayload: unknown;
    blockedReason: string | null;
    generatedAt: string | null;
  } | null;
};

export async function getDiagnosisForAdmin(
  id: string,
): Promise<AdminDiagnosisDetail | null> {
  const admin = createSupabaseAdminClient();

  const { data: request, error: requestError } = await admin
    .from("analysis_requests")
    .select(
      "id, created_at, submitted_at, completed_at, status, requires_review, review_reasons, profile_type, instagram_url, user_id",
    )
    .eq("id", id)
    .single();

  if (requestError || !request) {
    return null;
  }

  const [answersRes, assetsRes, jobsRes, resultsRes, profileRes] = await Promise.all([
    admin.from("analysis_answers").select("question_key, answer").eq("analysis_request_id", id),
    admin
      .from("analysis_assets")
      .select("id, asset_type, original_filename, mime_type, file_size_bytes, created_at")
      .eq("analysis_request_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("analysis_jobs")
      .select(
        "id, status, attempt_number, parent_job_id, trigger_reason, error_message, started_at, finished_at, created_at",
      )
      .eq("analysis_request_id", id)
      .order("attempt_number", { ascending: true }),
    admin
      .from("analysis_results")
      .select(
        "id, result_sequence, score_kind, confidence, requires_review, review_reasons, methodology_version, prompt_version, scoring_version, result_version, model_provider, model_name, input_tokens, output_tokens, model_duration_ms, estimated_cost_usd_cents, result_origin, is_test_analysis, generated_at, normalized_result",
      )
      .eq("analysis_request_id", id)
      .order("result_sequence", { ascending: false })
      .limit(1),
    request.user_id
      ? admin.from("profiles").select("full_name, email").eq("id", request.user_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const answers = (answersRes.data ?? []) as { question_key: string; answer: unknown }[];
  const answerByKey = new Map(answers.map((row) => [row.question_key, row.answer]));

  const latest = ((resultsRes.data ?? []) as Array<Record<string, unknown>>)[0];
  let report: AdminDiagnosisDetail["report"] = null;

  if (latest) {
    const { data: reports } = await admin
      .from("analysis_reports")
      .select("status, web_payload, blocked_reason, generated_at")
      .eq("analysis_result_id", latest.id as string)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = reports?.[0] as Record<string, unknown> | undefined;
    report = row
      ? {
          status: row.status as "blocked" | "generating" | "available" | "failed",
          webPayload: row.web_payload,
          blockedReason: row.blocked_reason as string | null,
          generatedAt: row.generated_at as string | null,
        }
      : null;
  }

  const profile = profileRes.data as { full_name: string | null; email: string | null } | null;

  return {
    request: {
      id: request.id,
      createdAt: request.created_at,
      submittedAt: request.submitted_at,
      completedAt: request.completed_at,
      status: request.status,
      requiresReview: request.requires_review,
      reviewReasons: (request.review_reasons ?? []) as ReviewReason[],
      profileType: request.profile_type,
      instagramUrl: request.instagram_url,
      userId: request.user_id,
      userEmail: profile?.email ?? null,
      userFullName: profile?.full_name ?? null,
    },
    briefing: {
      niche: (answerByKey.get("niche") as string | undefined) ?? null,
      mainObjective: (answerByKey.get("mainObjective") as string[] | undefined) ?? [],
      mainDifficulty: (answerByKey.get("mainDifficulty") as string[] | undefined) ?? [],
    },
    assets: ((assetsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      assetType: row.asset_type as string,
      originalFilename: row.original_filename as string | null,
      mimeType: row.mime_type as string,
      fileSizeBytes: row.file_size_bytes as number,
      createdAt: row.created_at as string,
    })),
    jobs: ((jobsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      status: row.status as AnalysisStatus,
      attemptNumber: row.attempt_number as number,
      parentJobId: row.parent_job_id as string | null,
      triggerReason: row.trigger_reason as string,
      errorMessage: row.error_message as string | null,
      startedAt: row.started_at as string | null,
      finishedAt: row.finished_at as string | null,
      createdAt: row.created_at as string,
    })),
    latestResult: latest
      ? {
          id: latest.id as string,
          resultSequence: latest.result_sequence as number,
          scoreKind: latest.score_kind as "complete" | "partial",
          confidence: latest.confidence as "high" | "medium" | "low",
          requiresReview: latest.requires_review as boolean,
          reviewReasons: (latest.review_reasons ?? []) as ReviewReason[],
          methodologyVersion: latest.methodology_version as string,
          promptVersion: latest.prompt_version as string,
          scoringVersion: latest.scoring_version as string,
          resultVersion: latest.result_version as string,
          modelProvider: latest.model_provider as string,
          modelName: latest.model_name as string,
          inputTokens: latest.input_tokens as number | null,
          outputTokens: latest.output_tokens as number | null,
          modelDurationMs: latest.model_duration_ms as number | null,
          estimatedCostUsdCents: latest.estimated_cost_usd_cents as number | null,
          resultOrigin: latest.result_origin as ResultOrigin,
          isTestAnalysis: latest.is_test_analysis as boolean,
          generatedAt: latest.generated_at as string,
          normalizedResult: latest.normalized_result as AnalysisCalculationResult,
        }
      : null,
    report,
  };
}
