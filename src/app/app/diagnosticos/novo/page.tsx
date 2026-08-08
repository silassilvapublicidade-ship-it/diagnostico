import { NewDiagnosisForm } from "./new-diagnosis-form";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function NewDiagnosisPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.erro) ? params.erro[0] : params.erro;

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Novo diagnostico
        </p>
        <h1 className="text-4xl font-semibold leading-none sm:text-5xl">
          Construa o contexto antes da conclusao.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-graphite/64">
          Vamos analisar seu perfil e identificar onde estao as maiores
          oportunidades. Poucas perguntas e alguns screenshots ja sao
          suficientes para comecar.
        </p>
      </header>

      {error ? (
        <p className="border-l-2 border-red-800 bg-white/50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <NewDiagnosisForm />
    </div>
  );
}
