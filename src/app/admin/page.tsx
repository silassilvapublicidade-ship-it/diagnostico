import Link from "next/link";

import { getAttentionItems, getOverviewMetrics } from "@/modules/admin/metrics";

import { formatDurationMs, formatNumber, formatPercent, formatUsdCents } from "./format";

export const dynamic = "force-dynamic";

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="kicker text-[10px] text-cream/50">{label}</p>
      <p className="mt-2 text-2xl font-black text-cream">{value}</p>
      {hint ? <p className="mt-1 text-xs text-cream/45">{hint}</p> : null}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [metrics, attentionItems] = await Promise.all([
    getOverviewMetrics(),
    getAttentionItems(),
  ]);

  const isOperational = metrics.health.status === "operational";

  return (
    <div className="space-y-10">
      <div>
        <p className="kicker text-accent">Projeto 8D · Admin</p>
        <h1 className="display-title mt-3 text-4xl leading-[0.95] sm:text-5xl">
          Visão Geral.
        </h1>
      </div>

      <section
        className={`dark-panel flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between ${
          isOperational ? "" : "border border-accent/50"
        }`}
      >
        <div className="flex items-center gap-4">
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${
              isOperational ? "bg-emerald-400" : "bg-accent"
            }`}
          />
          <div>
            <p className="text-xl font-black text-cream">
              {isOperational ? "OPERACIONAL" : "ATENÇÃO NECESSÁRIA"}
            </p>
            {metrics.health.reasons.length > 0 ? (
              <ul className="mt-1 text-sm text-cream/60">
                {metrics.health.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-cream/50">
                Últimas análises concluídas normalmente.
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-cream/40">
          Amostra: {metrics.health.sampleSize} análise{metrics.health.sampleSize === 1 ? "" : "s"} recente{metrics.health.sampleSize === 1 ? "" : "s"}
        </p>
      </section>

      <section>
        <p className="kicker text-accent">Precisa da sua atenção</p>
        {attentionItems.length === 0 ? (
          <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-cream/60">
            Nenhuma ocorrência crítica no momento.
          </p>
        ) : (
          <div className="mt-4 grid gap-2.5">
            {attentionItems.map((item) => (
              <Link
                className="card flex items-center justify-between gap-4 rounded-lg border border-accent/25 bg-accent/[0.06] px-5 py-4 transition hover:border-accent/60"
                href={item.href}
                key={item.kind}
              >
                <span className="text-sm font-semibold text-cream">{item.message}</span>
                <span className="font-mono text-lg text-accent">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="kicker text-accent">Diagnósticos</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Total" value={formatNumber(metrics.diagnoses.total)} />
          <MetricCard label="Concluídos" value={formatNumber(metrics.diagnoses.completed)} />
          <MetricCard label="Com erro" value={formatNumber(metrics.diagnoses.failed)} />
          <MetricCard label="Processando" value={formatNumber(metrics.diagnoses.processing)} />
          <MetricCard label="Precisam de revisão" value={formatNumber(metrics.diagnoses.requiresReview)} />
          <MetricCard label="Reprocessados" value={formatNumber(metrics.diagnoses.reprocessed)} />
          <MetricCard label="Taxa de sucesso" value={formatPercent(metrics.diagnoses.successRate)} hint="concluídos / (concluídos + erro)" />
          <MetricCard
            label="Tempo médio de processamento"
            value={formatDurationMs(metrics.processing.averageDurationMs)}
          />
        </div>
      </section>

      <section>
        <p className="kicker text-accent">Custo de IA</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Médio por diagnóstico"
            value={formatUsdCents(metrics.cost.averagePerDiagnosisUsdCents)}
          />
          <MetricCard label="Total hoje" value={formatUsdCents(metrics.cost.totalTodayUsdCents)} />
          <MetricCard label="Total no mês" value={formatUsdCents(metrics.cost.totalThisMonthUsdCents)} />
        </div>
        {metrics.latestModel ? (
          <p className="mt-3 text-xs text-cream/45">
            Modelo mais recente:{" "}
            <span className="text-cream/70">{metrics.latestModel.name}</span> · prompt{" "}
            <span className="text-cream/70">{metrics.latestModel.promptVersion}</span>
          </p>
        ) : null}
      </section>

      <section>
        <p className="kicker text-accent">Usuários</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard label="Total" value={formatNumber(metrics.users.total)} />
          <MetricCard label="Novos hoje" value={formatNumber(metrics.users.newToday)} />
          <MetricCard label="Novos em 7 dias" value={formatNumber(metrics.users.newLast7Days)} />
          <MetricCard label="Novos no mês" value={formatNumber(metrics.users.newThisMonth)} />
        </div>
      </section>
    </div>
  );
}
