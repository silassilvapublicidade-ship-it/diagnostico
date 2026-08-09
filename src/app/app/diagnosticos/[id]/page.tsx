import { notFound } from "next/navigation";

import {
  analysisCalculationResultSchema,
  type ReviewReason,
} from "@/domain/methodology-8d";
import { webPayloadSchema } from "@/modules/ai/map-to-domain";
import type { AiStrategicDiagnosis } from "@/modules/ai/output-schema";
import { runDiagnosisAnalysisAction } from "@/modules/analysis/actions";
import {
  DIMENSION_LABELS,
  REVIEW_REASON_LABELS,
} from "@/modules/analysis/labels";
import { getDiagnosis } from "@/modules/analysis/persistence";
import {
  CLASSIFICATION_COPY,
  CONFIDENCE_COPY,
  STATUS_COPY,
} from "@/modules/analysis/status";

import { AnalyzeButton } from "./analyze-button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
// The "Analisar agora" Server Action on this page calls Anthropic and can
// take several minutes (observed ~3 min in production). Sets the timeout
// for all Server Actions on this page - Vercel plan limits still apply and
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
  const profileTopAsset = diagnosis.assets.find(
    (asset) =>
      asset.asset_type === "profile_top" &&
      asset.mime_type.startsWith("image/"),
  );

  return (
    <div className="space-y-10">
      <header className="dark-panel p-6 text-cream sm:p-8">
        <p className="kicker text-accent">Dossie estrategico</p>
        <h1 className="display-title mt-4 max-w-4xl text-5xl leading-[0.9] sm:text-6xl">
          {state.title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-cream/68">
          {state.body}
        </p>
      </header>

      {errorParam ? (
        <p className="border-l-4 border-accent bg-white/70 px-4 py-3 text-sm font-semibold text-graphite">
          {errorParam}
        </p>
      ) : null}

      <form
        action={runDiagnosisAnalysisAction}
        className="lux-panel flex flex-col gap-3 p-5"
      >
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
          enviadas com cuidado. Nao feche esta pagina - o botao fica
          desabilitado enquanto a analise roda e o resultado aparece aqui assim
          que estiver pronto.
        </p>
      </form>

      {isDevelopmentFixture ? (
        <Callout title="Development fixture">
          Este resultado usa fixture de desenvolvimento. Ele valida pipeline,
          pesos, score, confidence e versionamento; nao e diagnostico real e nao
          interpreta screenshots ou briefing.
        </Callout>
      ) : null}

      {isTestAnalysis ? (
        <Callout title="Analise de teste controlado">
          Este resultado veio de uma chamada real a IA em modo de teste
          controlado. Nesta fase nao existe cobranca nem entrega comercial -
          serve para validar a qualidade da leitura antes de qualquer automacao
          publica.
        </Callout>
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

      {profileTopAsset ? (
        <section className="dark-panel flex flex-col gap-5 p-4 text-cream sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- private,
              per-owner evidence served through our own authenticated route,
              not a static/remote asset next/image can optimize. */}
          <img
            alt="Topo do perfil enviado como evidencia"
            className="w-full max-w-[240px] border border-accent/35"
            src={`/app/diagnosticos/${diagnosis.request.id}/assets/${profileTopAsset.id}`}
          />
          <div>
            <p className="kicker text-accent">Perfil enviado</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-cream/68">
              Topo do perfil enviado como evidencia - foto e bio ficam aqui como
              referencia enquanto voce le o diagnostico.
            </p>
          </div>
        </section>
      ) : null}

      {result ? (
        <>
          <section className="grid gap-10 border-y border-graphite/14 py-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-14">
            <div className="flex items-center gap-6">
              <ScoreRing score={result.score} />
              <div>
                <p className="kicker text-graphite/46">Score Estrategico</p>
                <p className="mt-2 text-sm text-graphite/60">
                  {result.scoreKind === "complete"
                    ? "Score completo"
                    : "Score parcial"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusChip
                label="Classificacao"
                value={CLASSIFICATION_COPY[result.classification]}
              />
              <StatusChip
                label="Confianca"
                value={CONFIDENCE_COPY[result.confidence]}
              />
              <StatusChip label="Metodologia" value="Metodologia Silas Silva" />
              <StatusChip label="Versao" value={result.methodologyVersion} />
            </div>
          </section>

          {webPayload ? (
            <section className="space-y-8">
              <div className="border-l-4 border-accent bg-graphite p-6 text-paper sm:p-8">
                <p className="kicker text-accent">Resumo executivo</p>
                <p className="mt-4 text-xl font-semibold leading-9 text-paper/86 sm:text-2xl">
                  {webPayload.executiveSummary}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ChecklistCard
                  title="Prioridades"
                  items={webPayload.priorities}
                />
                <ChecklistCard
                  title="Oportunidades"
                  items={webPayload.opportunities}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <PlanCard
                  timeframe="24 horas"
                  items={webPayload.actionPlan24h}
                />
                <PlanCard timeframe="7 dias" items={webPayload.actionPlan7d} />
                <PlanCard
                  timeframe="30 dias"
                  items={webPayload.actionPlan30d}
                />
              </div>

              <ChecklistCard
                title="Sugestoes de conteudo"
                items={webPayload.contentSuggestions}
              />
            </section>
          ) : null}

          <section>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="kicker text-accent">8 Dimensoes Estrategicas</p>
                <h2 className="mt-2 text-4xl font-black">Leitura inicial</h2>
              </div>
              {result.requiresReview ? (
                <p className="text-sm text-red-800">Revisao obrigatoria</p>
              ) : null}
            </div>

            <div className="grid gap-3">
              {result.dimensionScores.map((dimension) => {
                const richDimension = webPayload?.dimensions.find(
                  (candidate) => candidate.dimension === dimension.dimension,
                );

                return (
                  <DimensionCard
                    key={dimension.dimension}
                    label={DIMENSION_LABELS[dimension.dimension]}
                    score={
                      dimension.status === "evaluated"
                        ? (dimension.score ?? null)
                        : null
                    }
                    body={
                      richDimension?.diagnosis ?? dimension.safeRecommendation
                    }
                    strategicDiagnosis={richDimension?.strategicDiagnosis}
                    limitations={dimension.limitations}
                  />
                );
              })}
            </div>
          </section>

          {result.reviewReasons.length > 0 ? (
            <Callout title="Pontos de atencao desta leitura">
              <ul className="space-y-2">
                {result.reviewReasons.map((reason) => (
                  <li key={reason}>{REVIEW_REASON_LABELS[reason] ?? reason}</li>
                ))}
              </ul>
            </Callout>
          ) : null}
        </>
      ) : (
        <section className="lux-panel p-6">
          <h2 className="text-3xl font-black">Resultado ainda nao liberado.</h2>
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
    <div className="lux-panel p-4">
      <p className="kicker text-graphite/42">{label}</p>
      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-graphite/14 bg-white/58 px-4 py-3">
      <p className="kicker text-[10px] text-graphite/42">{label}</p>
      <p className="mt-2 text-base font-black">{value}</p>
    </div>
  );
}

function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-l-4 border-accent bg-white/64 px-5 py-4">
      <p className="kicker text-accent">{title}</p>
      <div className="mt-2 text-sm leading-6 text-graphite/70">{children}</div>
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  const percentage = Math.max(0, Math.min(100, score));

  return (
    <div
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full sm:h-36 sm:w-36"
      style={{
        background: `conic-gradient(var(--accent) ${percentage * 3.6}deg, color-mix(in srgb, var(--graphite) 12%, transparent) 0deg)`,
      }}
    >
      <div className="flex h-[calc(100%-14px)] w-[calc(100%-14px)] flex-col items-center justify-center rounded-full bg-paper">
        <span className="display-title text-5xl leading-none">{score}</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite/46">
          de 100
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="h-1.5 w-full rounded-full border border-dashed border-graphite/20" />
    );
  }

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite/10">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
}

function DimensionCard({
  label,
  score,
  body,
  strategicDiagnosis,
  limitations,
}: {
  label: string;
  score: number | null;
  body: string;
  strategicDiagnosis?: AiStrategicDiagnosis | undefined;
  limitations: string[];
}) {
  return (
    <details className="group border border-graphite/12 bg-white/48 open:bg-white/78">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-black">{label}</p>
            <p className="shrink-0 text-sm text-graphite/56">
              {score !== null ? `${score} pontos` : "Evidencia insuficiente"}
            </p>
          </div>
          <div className="mt-3">
            <ScoreBar score={score} />
          </div>
        </div>
        <span className="shrink-0 font-mono text-xl leading-none text-graphite/40 transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-5 border-t border-graphite/10 px-5 pb-5 pt-4 text-sm leading-6 text-graphite/70">
        {strategicDiagnosis ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <InsightBlock
              label="Diagnostico"
              value={strategicDiagnosis.problem}
            />
            <InsightBlock
              label="Evidencia"
              value={strategicDiagnosis.evidence}
            />
            <InsightBlock
              label="Consequencia"
              value={strategicDiagnosis.consequence}
            />
            <InsightBlock
              label="Correcao"
              value={strategicDiagnosis.correction}
            />
            <InsightBlock
              label="Exemplo aplicado"
              value={strategicDiagnosis.practical_example}
            />
            <InsightBlock
              label="Primeiro passo"
              value={strategicDiagnosis.next_step}
            />
          </div>
        ) : (
          <p>{body}</p>
        )}
        {limitations.length > 0 ? (
          <p className="border-t border-graphite/10 pt-3 text-graphite/50">
            Limite: {limitations.join("; ")}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function InsightBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-graphite/10 bg-paper/70 p-4">
      <p className="kicker text-[10px] text-accent">{label}</p>
      <p className="mt-2 text-sm leading-6 text-graphite/72">{value}</p>
    </div>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="lux-panel p-5">
      <p className="kicker text-accent">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-graphite/72">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
            <span className="mt-0.5 shrink-0 text-accent">&rarr;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCard({
  timeframe,
  items,
}: {
  timeframe: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="lux-panel p-5">
      <span className="inline-block bg-graphite px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-paper">
        {timeframe}
      </span>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-graphite/72">
        {items.map((item, index) => (
          <li className="flex gap-2" key={item}>
            <span className="shrink-0 font-semibold text-accent">
              {index + 1}.
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
