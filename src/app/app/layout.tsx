import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/session";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();
  const navItems = [
    { href: "/app", label: "Inicio", index: "01" },
    { href: "/app/diagnosticos", label: "Meus diagnosticos", index: "02" },
    { href: "/app/diagnosticos/novo", label: "Novo diagnostico", index: "03" },
  ];
  const methodSteps = [
    "Entender",
    "Priorizar",
    "Corrigir",
    "Construir",
    "Medir",
  ];

  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] lg:grid-cols-[310px_1fr]">
        <aside className="flex flex-col justify-between gap-10 border-b border-cream/10 bg-panel/80 px-5 py-5 sm:px-8 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
          <div>
            <Link className="group block" href="/app">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent bg-accent text-sm font-black text-ink">
                  SS
                </span>
                <div>
                  <p className="kicker text-accent">Diagnostico</p>
                  <p className="mt-1 text-sm font-semibold text-cream">
                    Estrategico de Perfil
                  </p>
                </div>
              </div>
            </Link>

            <nav className="mt-10 grid gap-2 text-sm">
              {navItems.map((item) => (
                <Link
                  className="group grid grid-cols-[2.4rem_1fr] items-center rounded-lg border border-white/8 bg-white/[0.035] px-3 py-3 text-cream/72 transition hover:border-accent/70 hover:bg-accent/10 hover:text-cream"
                  href={item.href}
                  key={item.href}
                >
                  <span className="font-mono text-[11px] text-accent">
                    {item.index}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="kicker text-cream/38">Metodo</p>
              <div className="mt-4 grid gap-2">
                {methodSteps.map((step, index) => (
                  <div
                    className="grid grid-cols-[2rem_1fr] items-center text-xs uppercase text-cream/62"
                    key={step}
                  >
                    <span className="font-mono text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="tracking-[0.14em]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
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
