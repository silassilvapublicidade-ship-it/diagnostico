import { notFound } from "next/navigation";

import { analysisCalculationResultSchema } from "@/domain/methodology-8d";
import { DIMENSION_LABELS } from "@/modules/analysis/labels";
import { getDiagnosis } from "@/modules/analysis/persistence";
import { CLASSIFICATION_COPY, STATUS_COPY } from "@/modules/analysis/status";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function DiagnosisDetailPage({ params }: PageProps) {
  const { id } = await params;
  const diagnosis = await getDiagnosis(id);

  if (!diagnosis) {
    notFound();
  }

  const state = STATUS_COPY[diagnosis.request.status];
  const parsedResult = diagnosis.result
    ? analysisCalculationResultSchema.safeParse(
        diagnosis.result.normalized_result,
      )
    : null;
  const result = parsedResult?.success ? parsedResult.data : null;
  const isDevelopmentFixture =
    diagnosis.result?.result_origin === "development_fixture";

  return (
    <div className="space-y-10">
      <header className="max-w-4xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Diagnostico
        </p>
        <h1 className="text-4xl font-semibold leading-none sm:text-5xl">
          {state.title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-graphite/64">
          {state.body}
        </p>
      </header>

      {isDevelopmentFixture ? (
        <section className="border-l-2 border-accent bg-white/50 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Development fixture
          </p>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            Este resultado usa fixture de desenvolvimento. Ele valida pipeline,
            pesos, score, confidence e versionamento; nao e diagnostico real e
            nao interpreta screenshots ou briefing.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Tipo" value={diagnosis.request.profile_type} />
        <Metric
          label="Criado em"
          value={new Date(diagnosis.request.created_at).toLocaleDateString(
            "pt-BR",
          )}
        />
        <Metric label="Evidencias" value={String(diagnosis.assets.length)} />
      </section>

      {result ? (
        <>
          <section className="grid gap-6 border-y border-graphite/10 py-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-graphite/46">
                Score Estrategico
              </p>
              <p className="mt-4 text-7xl font-semibold leading-none">
                {result.score}
              </p>
              <p className="mt-3 text-sm text-graphite/60">
                {result.scoreKind === "complete"
                  ? "Score completo"
                  : "Score parcial"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Metric
                label="Classificacao"
                value={CLASSIFICATION_COPY[result.classification]}
              />
              <Metric label="Confianca" value={result.confidence} />
              <Metric label="Metodologia" value="Metodologia Silas Silva" />
              <Metric label="Versao" value={result.methodologyVersion} />
            </div>
          </section>

          <section>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                  8 Dimensoes Estrategicas
                </p>
                <h2 className="mt-2 text-3xl font-semibold">Leitura inicial</h2>
              </div>
              {result.requiresReview ? (
                <p className="text-sm text-red-800">Revisao obrigatoria</p>
              ) : null}
            </div>

            <div className="divide-y divide-graphite/10 border-y border-graphite/10">
              {result.dimensionScores.map((dimension) => (
                <article
                  className="grid gap-4 py-5 md:grid-cols-[0.9fr_1.1fr]"
                  key={dimension.dimension}
                >
                  <div>
                    <p className="text-xl font-semibold">
                      {DIMENSION_LABELS[dimension.dimension]}
                    </p>
                    <p className="mt-2 text-sm text-graphite/58">
                      {dimension.status === "evaluated"
                        ? `${dimension.score} pontos`
                        : "Evidencia insuficiente"}
                    </p>
                  </div>
                  <div className="space-y-3 text-sm leading-6 text-graphite/68">
                    <p>{dimension.safeRecommendation}</p>
                    {dimension.limitations.length > 0 ? (
                      <p className="text-graphite/50">
                        Limite: {dimension.limitations.join("; ")}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {result.reviewReasons.length > 0 ? (
            <section className="border border-red-900/20 bg-white/45 p-6">
              <h2 className="text-2xl font-semibold">Motivos de revisao</h2>
              <ul className="mt-4 space-y-2 text-sm text-graphite/68">
                {result.reviewReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <section className="border border-graphite/10 bg-white/40 p-6">
          <h2 className="text-2xl font-semibold">
            Resultado ainda nao liberado.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite/64">
            A analise existe, mas ainda nao ha resultado consultavel para o
            usuario. Isso acontece quando o processamento ainda nao ocorreu ou
            quando a entrega esta bloqueada por revisao.
          </p>
          {diagnosis.request.review_reasons?.length ? (
            <p className="mt-4 text-sm text-red-900">
              Motivos: {diagnosis.request.review_reasons.join(", ")}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-graphite/10 bg-white/40 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite/42">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}
