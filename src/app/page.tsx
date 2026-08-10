import Image from "next/image";
import Link from "next/link";

import { deliverySteps, diagnosticDimensions } from "./app/method-content";

const STEP_DESCRIPTIONS: Record<(typeof deliverySteps)[number], string> = {
  Entender:
    "Voce responde um briefing rapido e envia prints do perfil como evidencia privada.",
  Priorizar:
    "A leitura cruza as 8 Dimensoes Estrategicas e aponta onde focar primeiro.",
  Corrigir:
    "Cada ponto fraco vem com o problema, a evidencia e uma correcao aplicavel.",
  Construir:
    "Exemplo pratico e proximo passo para cada dimensao, prontos para aplicar.",
  Medir:
    "Score por dimensao e classificacao geral para acompanhar a evolucao.",
};

const DIMENSION_HINTS: Record<(typeof diagnosticDimensions)[number]["code"], string> = {
  POS: "Como o perfil se apresenta e para quem.",
  IMP: "O que fica claro nos primeiros segundos de visita.",
  AUT: "Provas, credibilidade e sinais de confianca.",
  CON: "Consistencia, clareza e valor do que e publicado.",
  IDE: "Coerencia visual e de mensagem em todo o perfil.",
  CVR: "Caminho do visitante ate a proxima acao.",
  REL: "Sinais de proximidade e resposta com a audiencia.",
  OPR: "Pontos ainda nao explorados no perfil.",
};

const PROFILE_TYPES = [
  {
    code: "BUSINESS",
    title: "Perfil comercial",
    description:
      "Empresas e marcas onde autoridade, clareza de oferta e conversao pesam mais na leitura.",
  },
  {
    code: "CREATOR",
    title: "Imagem pessoal e conteudo",
    description:
      "Criadores e perfis pessoais onde identidade e consistencia de conteudo pesam mais na leitura.",
  },
] as const;

const TRUST_POINTS = [
  {
    title: "Evidencia privada",
    description:
      "Os prints enviados ficam vinculados apenas a sua conta. Nada e publicado ou compartilhado.",
  },
  {
    title: "Sem achismo disfarcado",
    description:
      "Evidencia observada, informacao declarada e interpretacao estrategica nunca se misturam sem aviso.",
  },
  {
    title: "Sinaliza em vez de arriscar",
    description:
      "Quando falta evidencia para uma leitura confiavel, o sistema mostra isso claramente em vez de inventar.",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col items-start gap-4 border-b border-white/12 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-black/40">
              <Image
                alt="Metodologia Silas Silva"
                className="object-contain"
                fill
                priority
                sizes="40px"
                src="/logo-mark.png"
              />
            </span>
            <p className="kicker text-cream/60">
              Diagnostico Estrategico de Perfil
            </p>
          </div>
          <Link
            className="border border-accent/60 px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-accent transition hover:bg-accent hover:text-ink"
            href="/entrar"
          >
            Area privada
          </Link>
        </header>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="kicker mb-5 text-accent">Metodologia Silas Silva</p>
            <h1 className="display-title max-w-3xl text-[2.18rem] leading-[0.9] text-cream sm:text-7xl lg:text-8xl">
              <span className="block">Diagnostico</span>
              <span className="block">antes de</span>
              <span className="block">publicar</span>
              <span className="block">mais.</span>
            </h1>
          </div>

          <div className="flex flex-col items-start gap-6 border-l border-accent/50 pl-6">
            <Image
              alt="Metodologia Silas Silva de Diagnostico Estrategico"
              className="h-auto w-full max-w-[280px]"
              height={683}
              priority
              src="/logo.png"
              width={1024}
            />
            <p className="max-w-[18rem] text-lg leading-8 text-cream/72 sm:max-w-md">
              Uma leitura privada do perfil pelas 8 Dimensoes Estrategicas:
              posicionamento, autoridade, conteudo, conversao e os sinais que
              orientam a proxima decisao.
            </p>
            <Link className="action-primary action-accent" href="/cadastro">
              Comecar diagnostico
            </Link>
          </div>
        </div>

        <section className="border-t border-white/12 py-16">
          <p className="kicker text-accent">Como funciona</p>
          <h2 className="display-title mt-3 max-w-xl text-3xl leading-[0.95] text-cream sm:text-5xl">
            Cinco passos, do briefing ao plano de acao.
          </h2>

          <div className="method-strip mt-10">
            {deliverySteps.map((step, index) => (
              <div
                className="dark-panel flex min-h-40 flex-col gap-3 p-4"
                key={step}
              >
                <p className="font-mono text-[10px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cream/85">
                  {step}
                </p>
                <p className="text-xs leading-5 text-cream/60">
                  {STEP_DESCRIPTIONS[step]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="kicker text-accent">8 Dimensoes Estrategicas</p>
              <h2 className="display-title mt-3 max-w-xl text-3xl leading-[0.95] text-cream sm:text-5xl">
                Uma leitura estruturada, nao um palpite.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-cream/60">
              Cada dimensao e avaliada com a evidencia disponivel. Quando
              falta evidencia, a dimensao fica sem nota em vez de receber um
              numero inventado.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {diagnosticDimensions.map((dimension, index) => (
              <div
                className="lux-panel flex flex-col gap-3 p-4"
                key={dimension.code}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[10px] font-black text-cream/34">
                    {dimension.code}
                  </span>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.06em] text-cream">
                  {dimension.label}
                </p>
                <p className="text-xs leading-5 text-cream/60">
                  {DIMENSION_HINTS[dimension.code]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16">
          <p className="kicker text-accent">Para quem e</p>
          <h2 className="display-title mt-3 max-w-xl text-3xl leading-[0.95] text-cream sm:text-5xl">
            A leitura muda com o tipo de perfil.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PROFILE_TYPES.map((profile) => (
              <div
                className="dark-panel flex flex-col gap-3 p-6"
                key={profile.code}
              >
                <p className="font-mono text-[10px] font-black text-accent">
                  {profile.code}
                </p>
                <p className="text-lg font-semibold text-cream">
                  {profile.title}
                </p>
                <p className="text-sm leading-6 text-cream/68">
                  {profile.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/12 py-16">
          <p className="kicker text-accent">Privacidade e confianca</p>
          <h2 className="display-title mt-3 max-w-xl text-3xl leading-[0.95] text-cream sm:text-5xl">
            Uma leitura privada, do seu jeito.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <div className="hairline mb-4" />
                <p className="text-sm font-semibold text-cream">
                  {point.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-cream/60">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="lux-panel my-6 flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker text-accent">Comece agora</p>
            <p className="display-title mt-3 max-w-md text-2xl leading-[0.95] text-cream sm:text-4xl">
              Antes de publicar mais, veja o que o perfil esta dizendo.
            </p>
          </div>
          <Link className="action-primary action-accent" href="/cadastro">
            Comecar diagnostico
          </Link>
        </section>

        <footer className="flex flex-col items-start gap-4 border-t border-white/12 pt-8 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-black/40">
              <Image
                alt="Metodologia Silas Silva"
                className="object-contain"
                fill
                sizes="32px"
                src="/logo-mark.png"
              />
            </span>
            <p className="text-xs leading-5 text-cream/50">
              Metodologia Silas Silva de Diagnostico Estrategico
            </p>
          </div>
          <Link
            className="font-mono text-xs uppercase tracking-[0.16em] text-cream/50 transition hover:text-accent"
            href="/entrar"
          >
            Area privada
          </Link>
        </footer>
      </section>
    </main>
  );
}
