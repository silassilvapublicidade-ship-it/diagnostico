import { NewDiagnosisForm } from "./new-diagnosis-form";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function NewDiagnosisPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;

  return (
    <div className="max-w-5xl space-y-8">
      <header className="grid gap-6 border-b border-graphite/14 pb-8 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div>
          <p className="kicker text-accent">Novo diagnostico</p>
          <h1 className="display-title mt-4 max-w-3xl text-5xl leading-[0.9] sm:text-6xl">
            Vamos mapear o seu momento.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-graphite/66">
            Uma sessao curta para separar percepcao de evidencia antes da
            leitura estrategica.
          </p>
        </div>
        <div className="border border-graphite bg-graphite p-4 text-paper">
          <p className="kicker text-accent">Ritmo</p>
          <p className="mt-3 text-sm leading-6 text-paper/70">
            Responda com clareza. O diagnostico ganha forca quando o contexto
            encontra as imagens certas.
          </p>
        </div>
      </header>

      {error ? (
        <p className="border-l-4 border-accent bg-white/70 px-4 py-3 text-sm font-semibold text-graphite">
          {error}
        </p>
      ) : null}

      <section className="lux-panel p-4 sm:p-6">
        <NewDiagnosisForm />
      </section>
    </div>
  );
}
