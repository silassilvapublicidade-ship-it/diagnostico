import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <aside className="dark-panel hidden pr-10 lg:flex lg:flex-col lg:justify-between">
          <Link className="kicker text-cream/62" href="/">
            Diagnostico Estrategico de Perfil
          </Link>
          <div className="pb-10">
            <p className="kicker mb-5 text-accent">Area privada</p>
            <h1 className="display-title max-w-md text-5xl leading-[0.9]">
              Entre na sala de diagnostico.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-cream/64">
              Contexto, evidencias e leitura estrategica no mesmo ambiente.
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center py-10 lg:pl-14">
          <div className="lux-panel w-full max-w-md p-6 text-graphite sm:p-8">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
