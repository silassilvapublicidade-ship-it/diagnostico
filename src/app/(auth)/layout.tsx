import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="min-h-screen bg-paper text-graphite">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <aside className="hidden border-r border-graphite/10 pr-10 lg:flex lg:flex-col lg:justify-between">
          <Link
            className="font-mono text-xs uppercase tracking-[0.24em] text-graphite/60"
            href="/"
          >
            Diagnostico Estrategico de Perfil
          </Link>
          <div className="pb-10">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Area privada
            </p>
            <h1 className="max-w-md text-5xl font-semibold leading-[0.96]">
              Entre com calma. O diagnostico precisa de contexto.
            </h1>
          </div>
        </aside>

        <div className="flex items-center justify-center py-10 lg:pl-14">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </main>
  );
}
