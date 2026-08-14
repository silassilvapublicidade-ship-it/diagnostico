import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/session";

import { deliverySteps, diagnosticDimensions } from "./method-content";
import { SidebarNav } from "./sidebar-nav";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto grid min-h-screen w-full max-w-[1540px] lg:grid-cols-[340px_1fr]">
        <aside className="relative flex flex-col justify-between gap-10 overflow-hidden border-b border-cream/10 bg-panel-deep px-5 py-5 sm:px-8 lg:sticky lg:top-0 lg:min-h-screen lg:self-start lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(255,90,0,0.22),transparent_17rem)]" />
          <div className="relative">
            <Link className="group block" href="/app">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-black/40 shadow-[0_0_45px_rgba(255,90,0,0.28)]">
                  <Image
                    alt="Projeto 8D"
                    className="object-contain"
                    fill
                    priority
                    sizes="48px"
                    src="/logo-mark.png"
                  />
                </span>
                <div>
                  <p className="kicker text-accent">Projeto 8D</p>
                  <p className="mt-1 text-sm font-semibold text-cream">
                    Diagnóstico Estratégico de Perfil
                  </p>
                </div>
              </div>
            </Link>

            <div className="mt-8 rounded-xl border border-accent/35 bg-[linear-gradient(135deg,rgba(255,90,0,0.18),rgba(255,90,0,0.04)_46%,rgba(255,255,255,0.035))] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
              <p className="kicker text-accent">Metodologia 8D</p>
              <p className="mt-4 flex items-baseline gap-3 text-accent">
                <span className="display-title text-6xl leading-none">8</span>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.16em]">
                  Dimensões
                </span>
              </p>
              <p className="mt-4 text-sm leading-6 text-cream/66">
                O diagnóstico cruza evidência, score, confiança e prioridade de
                ação sem misturar leitura técnica com achismo.
              </p>
            </div>

            <SidebarNav />

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between gap-4">
                <p className="kicker text-accent">8 Dimensões Estratégicas</p>
                <span className="font-mono text-[10px] font-black text-cream/34">
                  SCORE 8D
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {diagnosticDimensions.map((dimension, index) => (
                  <div
                    className="group grid grid-cols-[2.25rem_2.7rem_1fr] items-center rounded-lg border border-cream/8 bg-black/16 px-3 py-2.5 text-xs uppercase text-cream/68 transition hover:border-accent/50 hover:bg-accent/10"
                    key={dimension.code}
                  >
                    <span className="font-mono text-[10px] font-black text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[10px] font-black text-cream/34">
                      {dimension.code}
                    </span>
                    <span className="font-semibold tracking-[0.08em]">
                      {dimension.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-cream/10 bg-white/[0.035] p-4">
              <p className="kicker text-cream/42">Fluxo de entrega</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {deliverySteps.map((step) => (
                  <span
                    className="rounded-full border border-accent/25 bg-accent/8 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cream/70"
                    key={step}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative border-t border-white/10 pt-5">
            <p className="kicker text-cream/34">Area privada</p>
            <p className="mt-3 truncate text-sm text-cream/72">{user.email}</p>
            <form action={signOutAction} className="mt-5">
              <button className="text-sm font-semibold text-cream/62 transition hover:text-accent">
                Sair
              </button>
            </form>
          </div>
        </aside>

        <section className="min-h-screen min-w-0 bg-ink text-cream">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
