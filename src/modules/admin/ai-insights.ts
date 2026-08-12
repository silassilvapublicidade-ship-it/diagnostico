import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AiInsightsPeriod = "today" | "7d" | "30d";

function periodStart(period: AiInsightsPeriod, now: Date): string {
  if (period === "today") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  }
  const days = period === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

// The only error signal that exists today is analysis_jobs.error_message
// (free text). These categories are derived from the exact strings
// run-analysis.ts throws (AiAnalysisError messages), not invented -- a
// message that matches none of them falls into "outro" rather than being
// forced into a wrong bucket. If this needs to become a real taxonomy
// later, that's a schema change (an error_code column), proposed
// separately, not guessed here.
const ERROR_PATTERNS: Array<{ category: string; test: (message: string) => boolean }> = [
  { category: "recusa_seguranca", test: (m) => m.includes("recusada pelos filtros de seguranca") },
  { category: "limite_tokens", test: (m) => m.includes("truncada por limite de tokens") },
  { category: "schema_invalido", test: (m) => m.includes("nao seguiu o schema esperado") },
  { category: "json_invalido", test: (m) => m.includes("nao era um JSON valido") },
  { category: "sem_evidencia", test: (m) => m.includes("Nenhuma evidencia valida") },
  { category: "sem_resposta", test: (m) => m.includes("nao retornou nenhum bloco de texto") },
];

function classifyError(message: string | null): string {
  if (!message) {
    return "outro";
  }
  const match = ERROR_PATTERNS.find((pattern) => pattern.test(message));
  return match?.category ?? "outro";
}

export type ModelDistributionRow = {
  modelProvider: string;
  modelName: string;
  promptVersion: string;
  count: number;
};

export type ErrorBreakdownRow = {
  category: string;
  count: number;
  sampleMessage: string;
};

export type AiInsights = {
  period: AiInsightsPeriod;
  totalJobs: number;
  succeeded: number;
  failed: number;
  successRate: number | null;
  averageDurationMs: number | null;
  maxDurationMs: number | null;
  averageInputTokens: number | null;
  averageOutputTokens: number | null;
  averageCostUsdCents: number | null;
  totalCostUsdCents: number;
  modelDistribution: ModelDistributionRow[];
  errorBreakdown: ErrorBreakdownRow[];
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function getAiInsights(period: AiInsightsPeriod): Promise<AiInsights> {
  const admin = createSupabaseAdminClient();
  const since = periodStart(period, new Date());

  const [resultsRes, jobsFailedRes, jobsTotalRes] = await Promise.all([
    admin
      .from("analysis_results")
      .select(
        "model_provider, model_name, prompt_version, model_duration_ms, input_tokens, output_tokens, estimated_cost_usd_cents",
      )
      .gte("generated_at", since),
    admin
      .from("analysis_jobs")
      .select("error_message")
      .eq("status", "failed")
      .gte("created_at", since),
    admin.from("analysis_jobs").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const results = (resultsRes.data ?? []) as Array<{
    model_provider: string;
    model_name: string;
    prompt_version: string;
    model_duration_ms: number | null;
    input_tokens: number | null;
    output_tokens: number | null;
    estimated_cost_usd_cents: number | null;
  }>;
  const failedJobs = (jobsFailedRes.data ?? []) as Array<{ error_message: string | null }>;

  const succeeded = results.length;
  const failed = failedJobs.length;
  const successRate = succeeded + failed > 0 ? succeeded / (succeeded + failed) : null;

  const durations = results
    .map((row) => row.model_duration_ms)
    .filter((value): value is number => value != null);
  const inputTokens = results
    .map((row) => row.input_tokens)
    .filter((value): value is number => value != null);
  const outputTokens = results
    .map((row) => row.output_tokens)
    .filter((value): value is number => value != null);
  const costs = results
    .map((row) => row.estimated_cost_usd_cents)
    .filter((value): value is number => value != null);

  const modelKey = (row: { model_provider: string; model_name: string; prompt_version: string }) =>
    `${row.model_provider}::${row.model_name}::${row.prompt_version}`;
  const modelCounts = new Map<string, ModelDistributionRow>();
  for (const row of results) {
    const key = modelKey(row);
    const existing = modelCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      modelCounts.set(key, {
        modelProvider: row.model_provider,
        modelName: row.model_name,
        promptVersion: row.prompt_version,
        count: 1,
      });
    }
  }

  const errorCounts = new Map<string, ErrorBreakdownRow>();
  for (const job of failedJobs) {
    const category = classifyError(job.error_message);
    const existing = errorCounts.get(category);
    if (existing) {
      existing.count += 1;
    } else {
      errorCounts.set(category, {
        category,
        count: 1,
        sampleMessage: job.error_message ?? "Sem mensagem registrada.",
      });
    }
  }

  return {
    period,
    totalJobs: jobsTotalRes.count ?? 0,
    succeeded,
    failed,
    successRate,
    averageDurationMs: average(durations),
    maxDurationMs: durations.length > 0 ? Math.max(...durations) : null,
    averageInputTokens: average(inputTokens),
    averageOutputTokens: average(outputTokens),
    averageCostUsdCents: average(costs),
    totalCostUsdCents: costs.reduce((sum, value) => sum + value, 0),
    modelDistribution: [...modelCounts.values()].sort((a, b) => b.count - a.count),
    errorBreakdown: [...errorCounts.values()].sort((a, b) => b.count - a.count),
  };
}
