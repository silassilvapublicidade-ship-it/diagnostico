import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// A job stuck in "processing" past this age is surfaced as an anomaly --
// mirrors the platform-timeout risk documented for the Anthropic call
// (streamed, no hard server-side deadline in this phase), so a job that
// silently never got marked failed by the catch block is still visible.
const STUCK_JOB_MINUTES = 15;

// Health/attention sampling: never alarm on a handful of data points. Below
// this many finished jobs in the recent window, operational health defaults
// to OPERACIONAL and the cost-anomaly alert is simply omitted.
const MIN_HEALTH_SAMPLE = 5;
const RECENT_JOB_SAMPLE_SIZE = 20;
const FAILURE_RATE_ALERT_THRESHOLD = 0.3;
const COST_INCREASE_ALERT_RATIO = 1.5;

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function daysAgo(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

export type OperationalHealth = {
  status: "operational" | "attention";
  reasons: string[];
  sampleSize: number;
};

export type OverviewMetrics = {
  users: {
    total: number;
    newToday: number;
    newLast7Days: number;
    newThisMonth: number;
  };
  diagnoses: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
    requiresReview: number;
    reprocessed: number;
    successRate: number | null;
  };
  processing: {
    averageDurationMs: number | null;
  };
  cost: {
    averagePerDiagnosisUsdCents: number | null;
    totalTodayUsdCents: number;
    totalThisMonthUsdCents: number;
  };
  latestModel: {
    provider: string;
    name: string;
    promptVersion: string;
  } | null;
  health: OperationalHealth;
};

export type AttentionItem = {
  kind:
    | "errors"
    | "stuck_jobs"
    | "requires_review"
    | "repeated_attempts"
    | "cost_increase";
  count: number;
  message: string;
  href: string;
};

type JobRow = {
  id: string;
  analysis_request_id: string;
  status: string;
  attempt_number: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

function averageDurationMs(jobs: JobRow[]): number | null {
  const withDuration = jobs.filter((job) => job.started_at && job.finished_at);
  if (withDuration.length === 0) {
    return null;
  }
  const total = withDuration.reduce(
    (sum, job) =>
      sum +
      (new Date(job.finished_at!).getTime() - new Date(job.started_at!).getTime()),
    0,
  );
  return Math.round(total / withDuration.length);
}

/**
 * Deterministic health rule, evaluated over real recent executions -- never
 * an artificial Anthropic call. ATENÇÃO fires on either signal:
 * (1) a job stuck in "processing" past STUCK_JOB_MINUTES, or
 * (2) a failure rate above FAILURE_RATE_ALERT_THRESHOLD across the most
 *     recent RECENT_JOB_SAMPLE_SIZE finished jobs -- only once that sample
 *     has at least MIN_HEALTH_SAMPLE entries, so a cold start never alarms.
 */
function deriveOperationalHealth(
  recentFinishedJobs: JobRow[],
  stuckJobCount: number,
): OperationalHealth {
  const reasons: string[] = [];

  if (stuckJobCount > 0) {
    reasons.push(
      `${stuckJobCount} job${stuckJobCount === 1 ? "" : "s"} em processing há mais de ${STUCK_JOB_MINUTES} minutos`,
    );
  }

  const sample = recentFinishedJobs.slice(0, RECENT_JOB_SAMPLE_SIZE);
  if (sample.length >= MIN_HEALTH_SAMPLE) {
    const failed = sample.filter((job) => job.status === "failed").length;
    const failureRate = failed / sample.length;
    if (failureRate > FAILURE_RATE_ALERT_THRESHOLD) {
      reasons.push(
        `taxa de erro de ${Math.round(failureRate * 100)}% nas últimas ${sample.length} análises`,
      );
    }
  }

  return {
    status: reasons.length > 0 ? "attention" : "operational",
    reasons,
    sampleSize: sample.length,
  };
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const todayStart = startOfDayUtc(now).toISOString();
  const sevenDaysAgo = daysAgo(now, 7).toISOString();
  const monthStart = startOfMonthUtc(now).toISOString();
  const stuckBefore = new Date(now.getTime() - STUCK_JOB_MINUTES * 60 * 1000).toISOString();

  const [
    usersTotal,
    usersToday,
    users7d,
    usersMonth,
    diagnosesTotal,
    diagnosesCompleted,
    diagnosesFailed,
    diagnosesProcessing,
    diagnosesRequiresReview,
    reprocessedJobs,
    recentFinishedJobs,
    stuckJobs,
    costTodayResults,
    costMonthResults,
    allCostResults,
    latestResult,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    admin.from("analysis_requests").select("id", { count: "exact", head: true }),
    admin
      .from("analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    admin
      .from("analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    admin
      .from("analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing"),
    admin
      .from("analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("requires_review", true),
    admin
      .from("analysis_jobs")
      .select("analysis_request_id")
      .gte("attempt_number", 2),
    admin
      .from("analysis_jobs")
      .select("id, analysis_request_id, status, attempt_number, started_at, finished_at, created_at")
      .in("status", ["completed", "failed", "requires_review", "waiting_for_more_information"])
      .order("created_at", { ascending: false })
      .limit(RECENT_JOB_SAMPLE_SIZE),
    admin
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing")
      .lte("started_at", stuckBefore),
    admin
      .from("analysis_results")
      .select("estimated_cost_usd_cents")
      .gte("generated_at", todayStart),
    admin
      .from("analysis_results")
      .select("estimated_cost_usd_cents")
      .gte("generated_at", monthStart),
    admin.from("analysis_results").select("estimated_cost_usd_cents"),
    admin
      .from("analysis_results")
      .select("model_provider, model_name, prompt_version")
      .order("generated_at", { ascending: false })
      .limit(1),
  ]);

  const completed = diagnosesCompleted.count ?? 0;
  const failed = diagnosesFailed.count ?? 0;
  const successRate =
    completed + failed > 0 ? completed / (completed + failed) : null;

  const reprocessedRequestIds = new Set(
    ((reprocessedJobs.data ?? []) as { analysis_request_id: string }[]).map(
      (row) => row.analysis_request_id,
    ),
  );

  const sumCost = (rows: { estimated_cost_usd_cents: number | null }[] | null) =>
    (rows ?? []).reduce((sum, row) => sum + (row.estimated_cost_usd_cents ?? 0), 0);

  const allCostRows = (allCostResults.data ?? []) as {
    estimated_cost_usd_cents: number | null;
  }[];
  const nonNullCosts = allCostRows
    .map((row) => row.estimated_cost_usd_cents)
    .filter((value): value is number => value != null);
  const averagePerDiagnosisUsdCents =
    nonNullCosts.length > 0
      ? Math.round(nonNullCosts.reduce((sum, value) => sum + value, 0) / nonNullCosts.length)
      : null;

  const latest = ((latestResult.data ?? []) as {
    model_provider: string;
    model_name: string;
    prompt_version: string;
  }[])[0];

  const health = deriveOperationalHealth(
    (recentFinishedJobs.data ?? []) as JobRow[],
    stuckJobs.count ?? 0,
  );

  return {
    users: {
      total: usersTotal.count ?? 0,
      newToday: usersToday.count ?? 0,
      newLast7Days: users7d.count ?? 0,
      newThisMonth: usersMonth.count ?? 0,
    },
    diagnoses: {
      total: diagnosesTotal.count ?? 0,
      completed,
      failed,
      processing: diagnosesProcessing.count ?? 0,
      requiresReview: diagnosesRequiresReview.count ?? 0,
      reprocessed: reprocessedRequestIds.size,
      successRate,
    },
    processing: {
      averageDurationMs: averageDurationMs((recentFinishedJobs.data ?? []) as JobRow[]),
    },
    cost: {
      averagePerDiagnosisUsdCents,
      totalTodayUsdCents: sumCost(
        costTodayResults.data as { estimated_cost_usd_cents: number | null }[] | null,
      ),
      totalThisMonthUsdCents: sumCost(
        costMonthResults.data as { estimated_cost_usd_cents: number | null }[] | null,
      ),
    },
    latestModel: latest
      ? {
          provider: latest.model_provider,
          name: latest.model_name,
          promptVersion: latest.prompt_version,
        }
      : null,
    health,
  };
}

export async function getAttentionItems(): Promise<AttentionItem[]> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const stuckBefore = new Date(now.getTime() - STUCK_JOB_MINUTES * 60 * 1000).toISOString();
  const sevenDaysAgo = daysAgo(now, 7).toISOString();
  const fourteenDaysAgo = daysAgo(now, 14).toISOString();

  const [
    failedRequests,
    stuckJobs,
    requiresReview,
    reprocessedJobs,
    recentCostResults,
    baselineCostResults,
  ] = await Promise.all([
    admin
      .from("analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    admin
      .from("analysis_jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing")
      .lte("started_at", stuckBefore),
    admin
      .from("analysis_requests")
      .select("id", { count: "exact", head: true })
      .eq("requires_review", true)
      .in("status", ["requires_review", "waiting_for_more_information"]),
    admin
      .from("analysis_jobs")
      .select("analysis_request_id")
      .gte("attempt_number", 3),
    admin
      .from("analysis_results")
      .select("estimated_cost_usd_cents")
      .gte("generated_at", sevenDaysAgo),
    admin
      .from("analysis_results")
      .select("estimated_cost_usd_cents")
      .gte("generated_at", fourteenDaysAgo)
      .lte("generated_at", sevenDaysAgo),
  ]);

  const items: AttentionItem[] = [];

  const failedCount = failedRequests.count ?? 0;
  if (failedCount > 0) {
    items.push({
      kind: "errors",
      count: failedCount,
      message: `${failedCount} diagnóstico${failedCount === 1 ? "" : "s"} com erro`,
      href: "/admin/diagnosticos?status=failed",
    });
  }

  const stuckCount = stuckJobs.count ?? 0;
  if (stuckCount > 0) {
    items.push({
      kind: "stuck_jobs",
      count: stuckCount,
      message: `${stuckCount} job${stuckCount === 1 ? "" : "s"} possivelmente travado${stuckCount === 1 ? "" : "s"} em processing`,
      href: "/admin/diagnosticos?status=processing",
    });
  }

  const reviewCount = requiresReview.count ?? 0;
  if (reviewCount > 0) {
    items.push({
      kind: "requires_review",
      count: reviewCount,
      message: `${reviewCount} diagnóstico${reviewCount === 1 ? "" : "s"} aguardando revisão`,
      href: "/admin/diagnosticos?requiresReview=true",
    });
  }

  const repeatedRequestIds = new Set(
    ((reprocessedJobs.data ?? []) as { analysis_request_id: string }[]).map(
      (row) => row.analysis_request_id,
    ),
  );
  if (repeatedRequestIds.size > 0) {
    items.push({
      kind: "repeated_attempts",
      count: repeatedRequestIds.size,
      message: `${repeatedRequestIds.size} diagnóstico${repeatedRequestIds.size === 1 ? "" : "s"} com 3 ou mais tentativas`,
      href: "/admin/diagnosticos?reprocessed=true",
    });
  }

  const recentCosts = ((recentCostResults.data ?? []) as {
    estimated_cost_usd_cents: number | null;
  }[])
    .map((row) => row.estimated_cost_usd_cents)
    .filter((value): value is number => value != null);
  const baselineCosts = ((baselineCostResults.data ?? []) as {
    estimated_cost_usd_cents: number | null;
  }[])
    .map((row) => row.estimated_cost_usd_cents)
    .filter((value): value is number => value != null);

  if (recentCosts.length >= MIN_HEALTH_SAMPLE && baselineCosts.length >= MIN_HEALTH_SAMPLE) {
    const recentAvg = recentCosts.reduce((sum, value) => sum + value, 0) / recentCosts.length;
    const baselineAvg =
      baselineCosts.reduce((sum, value) => sum + value, 0) / baselineCosts.length;
    if (baselineAvg > 0 && recentAvg / baselineAvg >= COST_INCREASE_ALERT_RATIO) {
      const increasePct = Math.round((recentAvg / baselineAvg - 1) * 100);
      items.push({
        kind: "cost_increase",
        count: increasePct,
        message: `Custo médio de IA subiu ${increasePct}% nos últimos 7 dias`,
        href: "/admin/ia",
      });
    }
  }

  return items;
}
