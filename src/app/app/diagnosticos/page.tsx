import Link from "next/link";

import { listDiagnoses } from "@/modules/analysis/persistence";
import { STATUS_COPY } from "@/modules/analysis/status";

export const dynamic = "force-dynamic";

export default async function DiagnosesPage() {
  const diagnoses = await listDiagnoses();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Meus diagnosticos
          </p>
          <h1 className="text-4xl font-semibold leading-none">
            Historico de leituras.
          </h1>
        </div>
        <Link
          className="bg-graphite px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent"
          href="/app/diagnosticos/novo"
        >
          Novo diagnostico
        </Link>
      </header>

      {diagnoses.length === 0 ? (
        <section className="border border-graphite/10 bg-white/40 p-8">
          <h2 className="text-2xl font-semibold">Nada enviado ainda.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-graphite/64">
            O primeiro diagnostico cria o briefing, registra evidencias privadas
            e prepara o pipeline para a futura camada de inteligencia.
          </p>
        </section>
      ) : (
        <div className="divide-y divide-graphite/10 border-y border-graphite/10">
          {diagnoses.map((diagnosis) => (
            <Link
              className="grid gap-4 py-5 transition hover:bg-white/35 sm:grid-cols-[1fr_auto]"
              href={`/app/diagnosticos/${diagnosis.id}`}
              key={diagnosis.id}
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-graphite/46">
                  {diagnosis.profile_type === "business"
                    ? "Negocio"
                    : "Criador"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
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
                  <p className="mt-2 text-red-800">Revisao necessaria</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
