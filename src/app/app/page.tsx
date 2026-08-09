import Link from "next/link";

import { listDiagnoses } from "@/modules/analysis/persistence";
import { STATUS_COPY } from "@/modules/analysis/status";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const diagnoses = await listDiagnoses();
  const latest = diagnoses[0];

  return (
    <div className="space-y-8">
      <section className="dark-panel relative overflow-hidden p-6 text-cream sm:p-9 lg:p-10">
        <div className="max-w-4xl">
          <p className="kicker text-accent">Sala estrategica privada</p>
          <h1 className="display-title mt-5 max-w-4xl text-5xl leading-[0.9] sm:text-6xl lg:text-7xl">
            Diagnostico que encontra o gargalo.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cream/72 sm:text-lg sm:leading-8">
            Envie contexto e evidencias para receber uma leitura orientada por
            metodo: entender, priorizar, corrigir, construir e medir.
          </p>
        </div>

        <div className="method-strip mt-10 border-t border-white/12 pt-5">
          {["ENTENDER", "PRIORIZAR", "CORRIGIR", "CONSTRUIR", "MEDIR"].map(
            (step, index) => (
              <div
                className="rounded-lg border border-white/10 bg-white/[0.035] p-3"
                key={step}
              >
                <p className="font-mono text-[10px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-cream">
                  {step}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
        <Link
          className="lux-panel group p-6 transition hover:border-accent/60 sm:p-7"
          href="/app/diagnosticos/novo"
        >
          <p className="kicker text-accent">Novo diagnostico</p>
          <h2 className="mt-8 max-w-xl text-3xl font-black leading-tight sm:text-4xl">
            Iniciar uma sessao guiada de briefing e evidencias.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-graphite/66">
            O fluxo conduz a coleta sem parecer formulario frio: objetivo,
            perfil, desafio, link e materiais visuais para sustentar o
            diagnostico.
          </p>
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-accent">
            Comecar agora <span aria-hidden="true">-&gt;</span>
          </span>
        </Link>

        <Link
          className="lux-panel p-6 transition hover:border-accent/60 sm:p-7"
          href="/app/diagnosticos"
        >
          <p className="kicker text-accent">Meus diagnosticos</p>
          <p className="display-title mt-8 text-7xl leading-none text-cream">
            {diagnoses.length}
          </p>
          <p className="mt-3 text-sm text-cream/62">
            {diagnoses.length === 1
              ? "diagnostico criado"
              : "diagnosticos criados"}
          </p>
        </Link>
      </div>

      {latest ? (
        <section className="border-y border-graphite/14 py-6">
          <p className="kicker text-graphite/46">Ultimo movimento</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black">
                {STATUS_COPY[latest.status].title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-graphite/64">
                {STATUS_COPY[latest.status].body}
              </p>
            </div>
            <Link
              className="action-secondary"
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
