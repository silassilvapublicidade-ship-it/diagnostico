import Link from "next/link";

import { listDiagnoses } from "@/modules/analysis/persistence";
import { STATUS_COPY } from "@/modules/analysis/status";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const diagnoses = await listDiagnoses();
  const latest = diagnoses[0];

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Area privada
        </p>
        <h1 className="text-5xl font-semibold leading-[0.96] sm:text-6xl">
          Uma leitura estrategica, sem pressa e sem achismo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite/68">
          Envie contexto e evidencias para estruturar o Diagnostico Estrategico
          de Perfil. Nesta fase, resultados automaticos aparecem apenas quando o
          fixture de desenvolvimento estiver habilitado.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Link
          className="group border border-graphite/10 bg-white/45 p-6 transition hover:border-accent/40 hover:bg-white/70"
          href="/app/diagnosticos/novo"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Novo diagnostico
          </p>
          <h2 className="mt-8 text-3xl font-semibold leading-tight">
            Comecar por briefing e evidencias.
          </h2>
          <p className="mt-4 text-sm leading-6 text-graphite/62">
            O fluxo guia o envio em etapas e registra consentimento, retencao e
            assets privados.
          </p>
        </Link>

        <Link
          className="border border-graphite/10 bg-white/35 p-6 transition hover:border-accent/40 hover:bg-white/70"
          href="/app/diagnosticos"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-graphite/46">
            Meus diagnosticos
          </p>
          <p className="mt-8 text-5xl font-semibold">{diagnoses.length}</p>
          <p className="mt-3 text-sm text-graphite/62">
            {diagnoses.length === 1
              ? "diagnostico criado"
              : "diagnosticos criados"}
          </p>
        </Link>
      </div>

      {latest ? (
        <section className="border-t border-graphite/10 pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-graphite/46">
            Ultimo movimento
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {STATUS_COPY[latest.status].title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-graphite/64">
                {STATUS_COPY[latest.status].body}
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-accent"
              href={`/app/diagnosticos/${latest.id}`}
            >
              Abrir diagnostico
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
