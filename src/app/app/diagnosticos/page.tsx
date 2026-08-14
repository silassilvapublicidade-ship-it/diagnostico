import Link from "next/link";

import { listDiagnoses } from "@/modules/analysis/persistence";
import { STATUS_COPY } from "@/modules/analysis/status";

export const dynamic = "force-dynamic";

export default async function DiagnosesPage() {
  const diagnoses = await listDiagnoses();

  return (
    <div className="space-y-8">
      <header className="dark-panel flex flex-col gap-6 p-6 text-cream sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="kicker text-accent">Meus diagnósticos</p>
          <h1 className="display-title mt-4 max-w-2xl text-5xl leading-[0.9] sm:text-6xl">
            Arquivo de leituras estratégicas.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-cream/68">
            Cada envio preserva contexto, evidências, score e histórico para
            comparação futura.
          </p>
        </div>
        <Link
          className="action-primary action-accent"
          href="/app/diagnosticos/novo"
        >
          Novo diagnóstico
        </Link>
      </header>

      {diagnoses.length === 0 ? (
        <section className="lux-panel p-8">
          <p className="kicker text-accent">Sem registros</p>
          <h2 className="mt-4 text-3xl font-black">Nada enviado ainda.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-graphite/64">
            O primeiro diagnóstico cria o briefing, registra evidências privadas
            e prepara o pipeline para a futura camada de inteligência.
          </p>
        </section>
      ) : (
        <div className="grid gap-3">
          {diagnoses.map((diagnosis, index) => (
            <Link
              className="lux-panel grid gap-4 p-5 transition hover:border-accent/70 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              href={`/app/diagnosticos/${diagnosis.id}`}
              key={diagnosis.id}
            >
              <span className="choice-marker h-11 min-w-11">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="kicker text-graphite/46">
                  {diagnosis.profile_type === "business"
                    ? "Negócio"
                    : "Criador"}
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {STATUS_COPY[diagnosis.status].title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-graphite/62">
                  {STATUS_COPY[diagnosis.status].body}
                </p>
              </div>
              <div className="text-left text-sm text-graphite/54 sm:text-right">
                <p>
                  {new Date(diagnosis.created_at).toLocaleDateString("pt-BR")}
                </p>
                {diagnosis.requires_review ? (
                  <p className="mt-2 font-semibold text-accent">
                    Revisão necessária
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
