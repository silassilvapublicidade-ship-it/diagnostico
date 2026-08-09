import { NewDiagnosisForm } from "./new-diagnosis-form";

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
            <p className="kicker text-accent">Novo diagnostico</p>
            <h1 className="display-title mt-4 max-w-[19rem] text-[2.25rem] leading-[0.94] sm:max-w-4xl sm:text-6xl lg:text-7xl">
              Briefing para encontrar o gargalo.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cream/70">
              Uma sessao curta, guiada e objetiva para separar percepcao de
              evidencia antes da leitura estrategica.
            </p>
          </div>
          <div className="rounded-lg border border-accent/35 bg-accent/10 p-5">
            <p className="kicker text-accent">Ritmo</p>
            <p className="mt-3 text-sm leading-6 text-cream/72">
              Primeiro contexto. Depois evidencias. O diagnostico fica mais
              forte quando o que voce diz conversa com as imagens enviadas.
            </p>
          </div>
        </div>
        <div className="hairline mt-8" />
        <div className="mt-5 grid gap-3 text-xs font-black uppercase tracking-[0.12em] text-cream/58 sm:grid-cols-5">
          {["Entender", "Priorizar", "Corrigir", "Construir", "Medir"].map(
            (step) => (
              <span key={step}>{step}</span>
            ),
          )}
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
