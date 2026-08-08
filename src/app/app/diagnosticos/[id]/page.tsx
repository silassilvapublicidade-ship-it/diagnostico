import { notFound } from "next/navigation";

import {
  analysisCalculationResultSchema,
  type ReviewReason,
} from "@/domain/methodology-8d";
import { webPayloadSchema } from "@/modules/ai/map-to-domain";
import { runDiagnosisAnalysisAction } from "@/modules/analysis/actions";
import {
  DIMENSION_LABELS,
  REVIEW_REASON_LABELS,
} from "@/modules/analysis/labels";
import { getDiagnosis } from "@/modules/analysis/persistence";
import { CLASSIFICATION_COPY, STATUS_COPY } from "@/modules/analysis/status";

import { AnalyzeButton } from "./analyze-button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
// The "Analisar agora" Server Action on this page calls Anthropic and can
// take several minutes (observed ~3 min in production). Sets the timeout
// for all Server Actions on this page — Vercel plan limits still apply and
// may cap this lower; see docs/architecture.md for the platform-timeout
// risk this doesn't fully eliminate.
export const maxDuration = 300;

export default async function DiagnosisDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const diagnosis = await getDiagnosis(id);

  if (!diagnosis) {
    notFound();
  }

  const query = (await searchParams) ?? {};
  const errorParam = Array.isArray(query.erro) ? query.erro[0] : query.erro;

  const state = STATUS_COPY[diagnosis.request.status];
  const parsedResult = diagnosis.result
    ? analysisCalculationResultSchema.safeParse(
        diagnosis.result.normalized_result,
      )
    : null;
  const result = parsedResult?.success ? parsedResult.data : null;
  const isDevelopmentFixture =
    diagnosis.result?.result_origin === "development_fixture";
  const isTestAnalysis = diagnosis.result?.is_test_analysis === true;

  const parsedWebPayload =
    diagnosis.report?.status === "available"
      ? webPayloadSchema.safeParse(diagnosis.report.web_payload)
      : null;
  const webPayload = parsedWebPayload?.success ? parsedWebPayload.data : null;

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

      {errorParam ? (
        <p className="border-l-2 border-red-800 bg-white/50 px-4 py-3 text-sm text-red-900">
          {errorParam}
        </p>
      ) : null}

      <form action={runDiagnosisAnalysisAction} className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <input name="requestId" type="hidden" value={diagnosis.request.id} />
          <AnalyzeButton hasResult={Boolean(result)} />
          {diagnosis.request.status === "processing" ? (
            <span className="text-sm text-graphite/56">
              Ja existe uma analise em andamento.
            </span>
          ) : null}
        </div>
        <p className="max-w-md text-sm text-graphite/56">
          A leitura pode levar alguns minutos, porque analisamos as evidencias
          enviadas com cuidado. Nao feche esta pagina — o botao fica
          desabilitado enquanto a analise roda e o resultado aparece aqui assim
          que estiver pronto.
        </p>
      </form>

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

      {isTestAnalysis ? (
        <section className="border-l-2 border-accent bg-white/50 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Analise de teste controlado
          </p>
          <p className="mt-2 text-sm leading-6 text-graphite/70">
            Este resultado veio de uma chamada real a IA em modo de teste
            controlado. Nesta fase nao existe cobranca nem entrega comercial —
            serve para validar a qualidade da leitura antes de qualquer
            automacao publica.
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

          {webPayload ? (
            <section className="space-y-8 border-y border-graphite/10 py-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                  Resumo executivo
                </p>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-graphite/76">
                  {webPayload.executiveSummary}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <TextList title="Prioridades" items={webPayload.priorities} />
                <TextList
                  title="Oportunidades"
                  items={webPayload.opportunities}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <TextList title="Plano 24h" items={webPayload.actionPlan24h} />
                <TextList
                  title="Plano 7 dias"
                  items={webPayload.actionPlan7d}
                />
                <TextList
                  title="Plano 30 dias"
                  items={webPayload.actionPlan30d}
                />
              </div>

              <TextList
                title="Sugestoes de conteudo"
                items={webPayload.contentSuggestions}
              />
            </section>
          ) : null}

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
              {result.dimensionScores.map((dimension) => {
                const richDimension = webPayload?.dimensions.find(
                  (candidate) => candidate.dimension === dimension.dimension,
                );

                return (
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
                      {richDimension ? (
                        <p>{richDimension.diagnosis}</p>
                      ) : (
                        <p>{dimension.safeRecommendation}</p>
                      )}
                      {dimension.limitations.length > 0 ? (
                        <p className="text-graphite/50">
                          Limite: {dimension.limitations.join("; ")}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {result.reviewReasons.length > 0 ? (
            <section className="border-l-2 border-accent bg-white/50 px-5 py-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Pontos de atencao desta leitura
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-graphite/68">
                {result.reviewReasons.map((reason) => (
                  <li key={reason}>{REVIEW_REASON_LABELS[reason] ?? reason}</li>
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
              Motivos:{" "}
              {diagnosis.request.review_reasons
                .map(
                  (reason) =>
                    REVIEW_REASON_LABELS[reason as ReviewReason] ?? reason,
                )
                .join(", ")}
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

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite/46">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-graphite/68">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
