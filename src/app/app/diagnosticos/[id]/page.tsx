import { notFound } from "next/navigation";

import {
  analysisCalculationResultSchema,
  METHODOLOGY_VERSION,
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
import {
  formatPriceDisplay,
  INITIAL_PRICE_AMOUNT_CENTS,
} from "@/modules/billing";
import { startCheckoutAction } from "@/modules/billing/actions";

import { AnalyzeButton } from "./analyze-button";
import { CheckoutButton } from "./checkout-button";

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
  // Mercado Pago's own back_url query params (payment_id/status/etc.) are
  // never proof of payment -- assertDiagnosisCanBeProcessed and the webhook
  // are the only things that ever authorize anything. This only decides
  // which *copy* to show while status is still waiting_payment; it cannot
  // change what the user is allowed to do.
  const isReturningFromMercadoPago =
    diagnosis.request.status === "waiting_payment" &&
    (query.payment_id !== undefined ||
      query.collection_id !== undefined ||
      query.status !== undefined);

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
  const generatedMethodologyVersion = result
    ? formatVersionToken(result.methodologyVersion)
    : null;
  const currentMethodologyVersion = formatVersionToken(METHODOLOGY_VERSION);

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
        <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
          {errorParam}
        </p>
      ) : null}

      {diagnosis.request.status === "waiting_payment" && isReturningFromMercadoPago ? (
        <section className="lux-panel flex flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            <p className="text-base font-black text-cream">Confirmando pagamento...</p>
          </div>
          <p className="max-w-md text-sm text-graphite/56">
            Isso costuma levar poucos instantes. Atualize esta página em
            breve - a análise é liberada automaticamente assim que o
            pagamento for confirmado.
          </p>
        </section>
      ) : diagnosis.request.status === "waiting_payment" ? (
        <form
          action={startCheckoutAction}
          className="lux-panel flex flex-col gap-3 p-5"
        >
          <input name="requestId" type="hidden" value={diagnosis.request.id} />
          <CheckoutButton priceLabel={formatPriceDisplay(INITIAL_PRICE_AMOUNT_CENTS)} />
          <p className="max-w-md text-sm text-graphite/56">
            Pagamento único, sem assinatura. A análise só é liberada depois
            da confirmação do pagamento.
          </p>
        </form>
      ) : (
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
      )}

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
          <section className="dark-panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ScoreRing score={result.score} />
              <div>
                <p className="kicker text-accent">Lente estrategica</p>
                <h2 className="mt-3 max-w-md text-3xl font-black leading-tight">
                  O perfil foi lido pelas 8 Dimensoes Estrategicas.
                </h2>
                <p className="mt-3 text-sm leading-6 text-cream/58">
                  {result.scoreKind === "complete"
                    ? "Score completo, com todas as dimensoes consideradas."
                    : "Score parcial, calculado apenas com dimensoes avaliaveis."}
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
              <StatusChip label="Método" value="Metodologia 8D" />
              <StatusChip
                label="Versao atual"
                value={currentMethodologyVersion}
              />
              {generatedMethodologyVersion &&
              result.methodologyVersion !== METHODOLOGY_VERSION ? (
                <StatusChip
                  label="Registro historico"
                  value={generatedMethodologyVersion}
                />
              ) : null}
            </div>
          </section>

          {webPayload ? (
            <section className="space-y-8">
              <div className="lux-panel overflow-hidden">
                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[13rem_1fr]">
                  <div>
                    <p className="kicker text-accent">Resumo executivo</p>
                    <p className="mt-4 text-sm leading-6 text-cream/54">
                      A leitura abaixo resume o gargalo central antes do plano
                      de acao.
                    </p>
                  </div>
                  <p className="max-w-4xl text-xl font-semibold leading-9 text-cream/88 sm:text-2xl">
                    {webPayload.executiveSummary}
                  </p>
                </div>
                <div className="hairline" />
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
                <p className="text-sm font-semibold text-accent">
                  Revisao obrigatoria
                </p>
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
            <p className="mt-4 text-sm font-semibold text-accent">
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
      <p className="kicker text-accent">{label}</p>
      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cream/10 bg-black/20 px-4 py-3">
      <p className="kicker text-[10px] text-accent">{label}</p>
      <p className="mt-2 text-base font-black text-cream">{value}</p>
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
    <section className="rounded-lg border border-accent/30 bg-accent/10 px-5 py-4">
      <p className="kicker text-accent">{title}</p>
      <div className="mt-2 text-sm leading-6 text-cream/70">{children}</div>
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
      <div className="flex h-[calc(100%-14px)] w-[calc(100%-14px)] flex-col items-center justify-center rounded-full bg-panel">
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
      <div className="h-1.5 w-full rounded-full border border-dashed border-cream/18" />
    );
  }

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
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
    <details className="group rounded-lg border border-cream/10 bg-panel/84 open:border-accent/35 open:bg-panel-soft">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition hover:bg-accent/8">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-black">{label}</p>
            <p className="shrink-0 text-sm text-cream/56">
              {score !== null ? `${score} pontos` : "Evidencia insuficiente"}
            </p>
          </div>
          <div className="mt-3">
            <ScoreBar score={score} />
          </div>
        </div>
        <span className="shrink-0 font-mono text-xl leading-none text-accent transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-5 border-t border-cream/10 px-5 pb-5 pt-4 text-sm leading-6 text-cream/70">
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
          <p className="border-t border-cream/10 pt-3 text-cream/50">
            Limite: {limitations.join("; ")}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function InsightBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cream/10 bg-black/18 p-4 shadow-[inset_3px_0_0_rgba(255,90,0,0.45)]">
      <p className="kicker text-[10px] text-accent">{label}</p>
      <p className="mt-2 text-sm leading-6 text-cream/72">{value}</p>
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
      <ul className="mt-4 space-y-3 text-sm leading-6 text-cream/72">
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
      <span className="inline-block rounded-md bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
        {timeframe}
      </span>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-cream/72">
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

function formatVersionToken(version: string) {
  const normalized = version
    .replace("methodology-8d@", "8D v")
    .replace("analysis-result@", "Resultado v")
    .replace("scoring-8d@", "Score v")
    .replace("prompt-not-integrated@", "Prompt base v");

  return normalized === version ? version : normalized;
}
