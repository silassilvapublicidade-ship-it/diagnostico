import Link from "next/link";

import { getAiInsights, type AiInsightsPeriod } from "@/modules/admin/ai-insights";

import { formatDurationMs, formatNumber, formatPercent, formatUsdCents } from "../format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PERIODS: Array<{ value: AiInsightsPeriod; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="kicker text-[10px] text-cream/50">{label}</p>
      <p className="mt-2 text-2xl font-black text-cream">{value}</p>
    </div>
  );
}

export default async function AdminAiInsightsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const raw = Array.isArray(params.period) ? params.period[0] : params.period;
  const period: AiInsightsPeriod = raw === "today" || raw === "7d" || raw === "30d" ? raw : "7d";

  const insights = await getAiInsights(period);

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker text-accent">Projeto 8D · Admin</p>
        <h1 className="display-title mt-3 text-4xl leading-[0.95] sm:text-5xl">
          IA & Qualidade.
        </h1>
      </div>

      <div className="flex gap-2">
        {PERIODS.map((option) => (
          <Link
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              option.value === period
                ? "border-accent bg-accent/15 text-accent"
                : "border-cream/15 text-cream/55 hover:border-accent/50 hover:text-cream"
            }`}
            href={`/admin/ia?period=${option.value}`}
            key={option.value}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <section>
        <p className="kicker text-accent">Volume e sucesso</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Jobs no período" value={formatNumber(insights.totalJobs)} />
          <MetricCard label="Sucesso" value={formatNumber(insights.succeeded)} />
          <MetricCard label="Erro" value={formatNumber(insights.failed)} />
          <MetricCard label="Taxa de sucesso" value={formatPercent(insights.successRate)} />
        </div>
      </section>

      <section>
        <p className="kicker text-accent">Duração e tokens</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Duração média" value={formatDurationMs(insights.averageDurationMs)} />
          <MetricCard label="Duração máxima" value={formatDurationMs(insights.maxDurationMs)} />
          <MetricCard label="Input tokens (médio)" value={formatNumber(insights.averageInputTokens)} />
          <MetricCard label="Output tokens (médio)" value={formatNumber(insights.averageOutputTokens)} />
        </div>
      </section>

      <section>
        <p className="kicker text-accent">Custo</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricCard label="Custo médio" value={formatUsdCents(insights.averageCostUsdCents)} />
          <MetricCard label="Custo total no período" value={formatUsdCents(insights.totalCostUsdCents)} />
        </div>
      </section>

      <section>
        <p className="kicker text-accent">Modelos e versões de prompt ativos</p>
        {insights.modelDistribution.length === 0 ? (
          <p className="mt-4 text-sm text-cream/50">Nenhuma análise concluída neste período.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-[0.06em] text-cream/45">
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Modelo</th>
                  <th className="px-4 py-3">Versão do prompt</th>
                  <th className="px-4 py-3">Análises</th>
                </tr>
              </thead>
              <tbody>
                {insights.modelDistribution.map((row) => (
                  <tr
                    className="border-b border-white/5 text-cream/80"
                    key={`${row.modelProvider}-${row.modelName}-${row.promptVersion}`}
                  >
                    <td className="px-4 py-3">{row.modelProvider}</td>
                    <td className="px-4 py-3">{row.modelName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.promptVersion}</td>
                    <td className="px-4 py-3">{formatNumber(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <p className="kicker text-accent">Erros no período</p>
        {insights.errorBreakdown.length === 0 ? (
          <p className="mt-4 text-sm text-cream/50">Nenhum erro registrado neste período.</p>
        ) : (
          <div className="mt-4 grid gap-2.5">
            {insights.errorBreakdown.map((row) => (
              <div
                className="rounded-lg border border-accent/25 bg-accent/[0.05] px-4 py-3"
                key={row.category}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-cream">{row.category}</span>
                  <span className="font-mono text-sm text-accent">{row.count}</span>
                </div>
                <p className="mt-1 truncate text-xs text-cream/45">{row.sampleMessage}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
