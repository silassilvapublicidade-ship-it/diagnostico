import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-graphite">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-graphite/10 pb-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-graphite/60">
            Diagnostico Estrategico de Perfil
          </p>
          <Link
            className="rounded-full border border-accent/35 px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-accent transition hover:bg-accent/10"
            href="/entrar"
          >
            Area privada
          </Link>
        </header>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Metodologia Silas Silva
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.96] tracking-normal text-graphite sm:text-6xl lg:text-7xl">
              Diagnostico estrategico antes de publicar mais.
            </h1>
          </div>

          <div className="border-l border-graphite/12 pl-6">
            <p className="max-w-md text-lg leading-8 text-graphite/72">
              Uma leitura privada do perfil pelas 8 Dimensoes Estrategicas:
              posicionamento, autoridade, conteudo, conversao e os sinais que
              orientam a proxima decisao.
            </p>
            <Link
              className="mt-6 inline-block bg-graphite px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent"
              href="/cadastro"
            >
              Comecar diagnostico
            </Link>
          </div>
        </div>

        <section className="grid gap-3 border-t border-graphite/10 pt-6 sm:grid-cols-5">
          {["ENTENDER", "PRIORIZAR", "CORRIGIR", "CONSTRUIR", "MEDIR"].map(
            (step) => (
              <div
                className="min-h-24 border border-graphite/10 bg-white/42 p-4"
                key={step}
              >
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-graphite/56">
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
