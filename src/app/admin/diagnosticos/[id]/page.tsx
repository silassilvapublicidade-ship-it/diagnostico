import Link from "next/link";
import { notFound } from "next/navigation";

import { DIMENSION_LABELS } from "@/modules/analysis/labels";
import { getDiagnosisForAdmin } from "@/modules/admin/diagnostics";
import { CLASSIFICATION_COPY, CONFIDENCE_COPY, STATUS_COPY } from "@/modules/analysis/status";

import { formatDateTime, formatDurationMs, formatNumber, formatUsdCents, shortId } from "../../format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 text-sm">
      <span className="text-cream/45">{label}</span>
      <span className="text-right text-cream/85">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="lux-panel p-6">
      <p className="kicker text-accent">{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type WebPayloadShape = {
  executiveSummary?: string;
  priorities?: string[];
  opportunities?: string[];
  actionPlan24h?: string[];
  actionPlan7d?: string[];
  actionPlan30d?: string[];
  globalLimitations?: string[];
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 p-4">
      <p className="kicker text-[10px] text-accent">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-cream/75">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="text-accent">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminDiagnosisDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getDiagnosisForAdmin(id);

  if (!detail) {
    notFound();
  }

  const { request, briefing, assets, jobs, latestResult, report } = detail;

  const evaluatedDimensions = (latestResult?.normalizedResult.dimensionScores ?? []).filter(
    (dimension) => dimension.status === "evaluated" && dimension.score != null,
  );
  const strongest = evaluatedDimensions.length
    ? [...evaluatedDimensions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
    : null;
  const weakest = evaluatedDimensions.length
    ? [...evaluatedDimensions].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0]
    : null;

  const webPayload = report?.webPayload as WebPayloadShape | null | undefined;
  const hasNarrativePayload = Boolean(webPayload?.executiveSummary);

  return (
    <div className="space-y-8">
      <div>
        <Link className="text-xs text-cream/45 hover:text-accent" href="/admin/diagnosticos">
          ← Diagnósticos
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="display-title text-3xl leading-[0.95] sm:text-4xl">
            {shortId(request.id)}
          </h1>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-cream/70">
            {STATUS_COPY[request.status].title}
          </span>
          {request.requiresReview ? (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Precisa de revisão
            </span>
          ) : null}
        </div>
      </div>

      <Section title="Cliente">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <InfoRow label="Nome" value={request.userFullName ?? "—"} />
            <InfoRow label="E-mail" value={request.userEmail ?? "—"} />
            <InfoRow label="Instagram" value={request.instagramUrl ?? "—"} />
            <InfoRow label="Tipo de perfil" value={request.profileType === "business" ? "Negócio" : "Criador"} />
            <InfoRow label="Nicho declarado" value={briefing.niche ?? "—"} />
          </div>
          <div>
            <InfoRow label="Criado em" value={formatDateTime(request.createdAt)} />
            <InfoRow label="Enviado em" value={formatDateTime(request.submittedAt)} />
            <InfoRow label="Concluído em" value={formatDateTime(request.completedAt)} />
            <InfoRow label="Evidências enviadas" value={formatNumber(assets.length)} />
          </div>
        </div>

        {briefing.mainObjective.length > 0 || briefing.mainDifficulty.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ListBlock items={briefing.mainObjective} title="Objetivo" />
            <ListBlock items={briefing.mainDifficulty} title="Dificuldades declaradas" />
          </div>
        ) : null}

        {assets.length > 0 ? (
          <div className="mt-4">
            <p className="kicker text-[10px] text-cream/45">Evidências</p>
            <ul className="mt-2 grid gap-1.5 text-xs text-cream/65 sm:grid-cols-2">
              {assets.map((asset) => (
                <li className="flex justify-between gap-3 rounded border border-white/8 bg-black/10 px-3 py-2" key={asset.id}>
                  <span>{asset.assetType}</span>
                  <span className="text-cream/40">{Math.round(asset.fileSizeBytes / 1024)} KB</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section title="Resultado estratégico — o que o cliente recebeu">
        {!latestResult ? (
          <p className="text-sm text-cream/50">Nenhum resultado gerado ainda para este diagnóstico.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <InfoRow label="Score" value={String(latestResult.normalizedResult.score)} />
              <InfoRow
                label="Classificação"
                value={CLASSIFICATION_COPY[latestResult.normalizedResult.classification]}
              />
              <InfoRow label="Confiança" value={CONFIDENCE_COPY[latestResult.confidence]} />
              <InfoRow label="Tipo de score" value={latestResult.scoreKind === "complete" ? "Completo" : "Parcial"} />
            </div>

            {strongest || weakest ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {strongest ? (
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
                    <p className="kicker text-[10px] text-emerald-300">Maior força</p>
                    <p className="mt-1 text-sm font-semibold text-cream">
                      {DIMENSION_LABELS[strongest.dimension]} · {strongest.score}
                    </p>
                  </div>
                ) : null}
                {weakest ? (
                  <div className="rounded-lg border border-accent/30 bg-accent/[0.06] p-4">
                    <p className="kicker text-[10px] text-accent">Maior gargalo</p>
                    <p className="mt-1 text-sm font-semibold text-cream">
                      {DIMENSION_LABELS[weakest.dimension]} · {weakest.score}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasNarrativePayload ? (
              <>
                <div className="rounded-lg border border-white/10 bg-black/15 p-4">
                  <p className="kicker text-[10px] text-accent">Resumo executivo</p>
                  <p className="mt-2 text-sm leading-6 text-cream/80">{webPayload!.executiveSummary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ListBlock items={webPayload!.priorities ?? []} title="Prioridades" />
                  <ListBlock items={webPayload!.opportunities ?? []} title="Oportunidades" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ListBlock items={webPayload!.actionPlan24h ?? []} title="Plano — 24h" />
                  <ListBlock items={webPayload!.actionPlan7d ?? []} title="Plano — 7 dias" />
                  <ListBlock items={webPayload!.actionPlan30d ?? []} title="Plano — 30 dias" />
                </div>
              </>
            ) : (
              <p className="text-xs text-cream/40">
                Sem conteúdo narrativo persistido para este resultado (origem: {latestResult.resultOrigin}).
              </p>
            )}

            <div>
              <p className="kicker text-[10px] text-accent">8 Dimensões</p>
              <div className="mt-3 grid gap-2">
                {latestResult.normalizedResult.dimensionScores.map((dimension) => (
                  <details
                    className="group rounded-lg border border-white/10 bg-white/[0.02]"
                    key={dimension.dimension}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm">
                      <span className="font-semibold text-cream">
                        {DIMENSION_LABELS[dimension.dimension]}
                      </span>
                      <span className="flex items-center gap-3 text-cream/50">
                        <span>{dimension.status === "evaluated" ? dimension.score : "Sem evidência"}</span>
                        <span className="font-mono text-xs transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <div className="grid gap-2 border-t border-white/10 px-4 py-3 text-xs text-cream/65 sm:grid-cols-2">
                      <p>Confiança: {CONFIDENCE_COPY[dimension.confidence]}</p>
                      <p>Peso efetivo: {dimension.effectiveWeight}</p>
                      {dimension.limitations.length > 0 ? (
                        <p className="sm:col-span-2">Limitações: {dimension.limitations.join("; ")}</p>
                      ) : null}
                      <p className="sm:col-span-2">{dimension.safeRecommendation}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Visão técnica — como foi produzida">
        {!latestResult ? (
          <p className="text-sm text-cream/50">Sem resultado técnico persistido ainda.</p>
        ) : (
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <InfoRow label="Provider" value={latestResult.modelProvider} />
              <InfoRow label="Modelo" value={latestResult.modelName} />
              <InfoRow label="Versão do prompt" value={latestResult.promptVersion} />
              <InfoRow label="Versão da metodologia" value={latestResult.normalizedResult.methodologyVersion} />
              <InfoRow label="Versão do scoring" value={latestResult.scoringVersion} />
              <InfoRow label="Versão do resultado" value={latestResult.resultVersion} />
              <InfoRow label="Origem do resultado" value={latestResult.resultOrigin} />
              <InfoRow label="Análise de teste" value={latestResult.isTestAnalysis ? "Sim" : "Não"} />
            </div>
            <div>
              <InfoRow label="Input tokens" value={formatNumber(latestResult.inputTokens)} />
              <InfoRow label="Output tokens" value={formatNumber(latestResult.outputTokens)} />
              <InfoRow
                label="Tokens totais"
                value={formatNumber(
                  latestResult.inputTokens != null || latestResult.outputTokens != null
                    ? (latestResult.inputTokens ?? 0) + (latestResult.outputTokens ?? 0)
                    : null,
                )}
              />
              <InfoRow label="Duração do modelo" value={formatDurationMs(latestResult.modelDurationMs)} />
              <InfoRow label="Custo estimado" value={formatUsdCents(latestResult.estimatedCostUsdCents)} />
              <InfoRow label="Gerado em" value={formatDateTime(latestResult.generatedAt)} />
              <InfoRow
                label="Motivos de revisão"
                value={latestResult.reviewReasons.length > 0 ? latestResult.reviewReasons.join(", ") : "—"}
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="kicker text-[10px] text-cream/45">Histórico de jobs</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left text-cream/45">
                  <th className="py-2 pr-4">Tentativa</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Motivo</th>
                  <th className="py-2 pr-4">Iniciado</th>
                  <th className="py-2 pr-4">Finalizado</th>
                  <th className="py-2">Erro</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr className="border-b border-white/5 text-cream/70" key={job.id}>
                    <td className="py-2 pr-4">
                      #{job.attemptNumber}
                      {job.parentJobId ? " (retry)" : ""}
                    </td>
                    <td className="py-2 pr-4">{STATUS_COPY[job.status].title}</td>
                    <td className="py-2 pr-4">{job.triggerReason}</td>
                    <td className="py-2 pr-4">{formatDateTime(job.startedAt)}</td>
                    <td className="py-2 pr-4">{formatDateTime(job.finishedAt)}</td>
                    <td className="py-2 text-accent/80">{job.errorMessage ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}
