import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col items-start gap-4 border-b border-white/12 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="kicker text-cream/60">
            Diagnostico Estrategico de Perfil
          </p>
          <Link
            className="border border-accent/60 px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-accent transition hover:bg-accent hover:text-ink"
            href="/entrar"
          >
            Area privada
          </Link>
        </header>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="kicker mb-5 text-accent">Metodologia Silas Silva</p>
            <h1 className="display-title max-w-3xl text-[2.18rem] leading-[0.9] text-cream sm:text-7xl lg:text-8xl">
              <span className="block">Diagnostico</span>
              <span className="block">antes de</span>
              <span className="block">publicar</span>
              <span className="block">mais.</span>
            </h1>
          </div>

          <div className="border-l border-accent/50 pl-6">
            <p className="max-w-[18rem] text-lg leading-8 text-cream/72 sm:max-w-md">
              Uma leitura privada do perfil pelas 8 Dimensoes Estrategicas:
              posicionamento, autoridade, conteudo, conversao e os sinais que
              orientam a proxima decisao.
            </p>
            <Link
              className="action-primary action-accent mt-6"
              href="/cadastro"
            >
              Comecar diagnostico
            </Link>
          </div>
        </div>

        <section className="method-strip border-t border-white/12 pt-6">
          {["ENTENDER", "PRIORIZAR", "CORRIGIR", "CONSTRUIR", "MEDIR"].map(
            (step, index) => (
              <div
                className="min-h-24 border border-white/10 bg-white/[0.035] p-4"
                key={step}
              >
                <p className="font-mono text-[10px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-cream/72">
                  {step}
                </p>
              </div>
            ),
          )}
        </section>
      </section>
    </main>
  );
}
