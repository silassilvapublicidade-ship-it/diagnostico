import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/session";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-paper text-graphite">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-graphite/10 pb-5">
          <Link
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-graphite/60"
            href="/app"
          >
            Diagnostico Estrategico de Perfil
          </Link>
          <form action={signOutAction}>
            <button className="text-sm text-graphite/60 transition hover:text-accent">
              Sair
            </button>
          </form>
        </header>

        <div className="grid flex-1 gap-8 py-8 lg:grid-cols-[220px_1fr] lg:py-10">
          <aside className="lg:border-r lg:border-graphite/10 lg:pr-6">
            <p className="text-sm text-graphite/54">{user.email}</p>
            <nav className="mt-6 flex gap-3 overflow-x-auto text-sm lg:flex-col lg:overflow-visible">
              <Link className="whitespace-nowrap hover:text-accent" href="/app">
                Inicio
              </Link>
              <Link
                className="whitespace-nowrap hover:text-accent"
                href="/app/diagnosticos"
              >
                Meus diagnosticos
              </Link>
              <Link
                className="whitespace-nowrap font-semibold text-accent"
                href="/app/diagnosticos/novo"
              >
                Novo diagnostico
              </Link>
            </nav>
          </aside>

          <section>{children}</section>
        </div>
      </div>
    </main>
  );
}
