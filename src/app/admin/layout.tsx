import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/modules/auth/actions";
import { requireAdmin } from "@/modules/auth/session";

import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireAdmin();

  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto grid min-h-screen w-full max-w-[1540px] lg:grid-cols-[280px_1fr]">
        <aside className="relative flex flex-col justify-between gap-8 overflow-hidden border-b border-cream/10 bg-panel-deep px-5 py-5 sm:px-8 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
          <div>
            <Link className="group block" href="/admin">
              <p className="kicker text-accent">Projeto 8D</p>
              <p className="mt-1 text-sm font-semibold text-cream">Admin</p>
            </Link>

            <AdminNav />
          </div>

          <div className="relative border-t border-white/10 pt-5">
            <p className="kicker text-cream/34">Sessão administrativa</p>
            <p className="mt-3 truncate text-sm text-cream/72">{user.email}</p>
            <div className="mt-4 flex items-center gap-4">
              <Link
                className="text-sm font-semibold text-cream/62 transition hover:text-accent"
                href="/app"
              >
                Ir para o app
              </Link>
              <form action={signOutAction}>
                <button className="text-sm font-semibold text-cream/62 transition hover:text-accent">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </aside>

        <section className="min-h-screen min-w-0 bg-ink text-cream">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
