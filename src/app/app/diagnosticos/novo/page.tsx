import { NewDiagnosisForm } from "./new-diagnosis-form";
import { deliverySteps, diagnosticDimensions } from "../../method-content";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function NewDiagnosisPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;

  return (
    <div className="w-[calc(100vw-2.5rem)] min-w-0 space-y-6 overflow-hidden sm:w-full">
      <header className="dark-panel w-full max-w-full overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div className="min-w-0">
            <p className="kicker text-accent">Novo diagnóstico</p>
            <h1 className="display-title mt-4 max-w-[19rem] text-[2.25rem] leading-[0.94] sm:max-w-4xl sm:text-6xl lg:text-7xl">
              Briefing para encontrar o gargalo.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cream/70">
              Uma sessão curta para reunir contexto e materiais antes da leitura
              nas 8 dimensões estratégicas.
            </p>
          </div>
          <div className="rounded-lg border border-accent/35 bg-accent/10 p-5">
            <p className="kicker text-accent">Entrada certa</p>
            <p className="mt-3 text-sm leading-6 text-cream/72">
              O diagnóstico fica mais forte quando objetivo, perfil, evidências
              visuais e link conversam entre si.
            </p>
          </div>
        </div>
        <div className="hairline mt-8" />
        <div className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="kicker text-accent">8 Dimensões avaliadas</p>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-cream/42">
              score + confiança + evidência
            </p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {diagnosticDimensions.map((dimension, index) => (
              <div
                className="grid grid-cols-[2rem_2.7rem_1fr] items-center rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs uppercase text-cream/68"
                key={dimension.code}
              >
                <span className="font-mono text-[10px] font-black text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] font-black text-cream/34">
                  {dimension.code}
                </span>
                <span className="font-black tracking-[0.08em]">
                  {dimension.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-cream/46">
            <span className="text-accent">Fluxo</span>
            {deliverySteps.map((step) => (
              <span
                className="rounded-full border border-white/10 px-2.5 py-1"
                key={step}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-cream">
          {error}
        </p>
      ) : null}

      <NewDiagnosisForm />
    </div>
  );
}
