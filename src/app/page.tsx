import Image from "next/image";
import Link from "next/link";

import { GlowBackground, Reveal } from "./landing-motion";
import { FullResultPreview, HeroResultPreview } from "./landing-result-preview";

// Preco provisorio - sera atualizado quando o valor final for definido.
const PRICE_VALUE = "R$ 99";
const PRICE_NOTE = "diagnóstico completo";
const PRICE_LABEL = `${PRICE_VALUE} · ${PRICE_NOTE}`;

const OFFER_INCLUDES = [
  "Score Estratégico por dimensão",
  "Pontos críticos com evidência",
  "Prioridades e plano de ação",
  "Leitura ajustada ao seu tipo de perfil",
] as const;

const PAIN_POINTS = [
  "Posicionamento confuso",
  "1ª impressão fraca",
  "Pouca autoridade",
  "Conteúdo sem direção",
  "Identidade inconsistente",
  "Conversão fraca",
  "Relacionamento raso",
  "Oportunidades perdidas",
] as const;

const RECEIVE_ITEMS = [
  "Score real do perfil",
  "Pontos críticos",
  "Prioridades",
  "Solução pronta pra aplicar",
  "Plano de ação",
] as const;

const HOW_IT_WORKS = [
  { title: "Conte sobre seu perfil", hint: "Perguntas rápidas" },
  { title: "Envie as evidências", hint: "Prints do perfil" },
  { title: "Receba sua leitura", hint: "Análise em profundidade" },
  { title: "Veja o que mudar", hint: "Diagnóstico e plano" },
] as const;

const DIMENSIONS = [
  { code: "POS", label: "Posicionamento" },
  { code: "IMP", label: "Primeira Impressão" },
  { code: "AUT", label: "Autoridade" },
  { code: "CON", label: "Conteúdo" },
  { code: "IDE", label: "Identidade" },
  { code: "CVR", label: "Conversão" },
  { code: "REL", label: "Relacionamento" },
  { code: "OPR", label: "Oportunidades" },
] as const;

const PROFILE_TYPES = [
  {
    code: "BUSINESS",
    title: "Perfil comercial",
    keywords: "Posicionamento · Autoridade · Conversão",
  },
  {
    code: "CREATOR",
    title: "Imagem pessoal e conteúdo",
    keywords: "Conteúdo · Identidade · Relacionamento",
  },
] as const;

const COMPARISON_ROWS = [
  { without: "Vou mudar a bio e ver.", with: "Sei o que mudar e por quê." },
  { without: "Preciso postar mais.", with: "O problema é conversão, não volume." },
  { without: "Feed mais bonito.", with: "Identidade forte, gargalo é outro." },
] as const;

const TRUST_POINTS = [
  { title: "Evidências privadas", hint: "Nunca publicadas ou compartilhadas" },
  { title: "Sem inventar dado", hint: "Falta de evidência fica clara" },
  { title: "Você decide", hint: "A aplicação é sua escolha" },
] as const;

const NAV_LINKS = [
  { href: "#o-que-voce-recebe", label: "O que você recebe" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#dimensoes", label: "8 Dimensões" },
] as const;

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="kicker text-accent">{kicker}</p>
      <h2 className="display-title mt-3 text-2xl leading-[1.1] text-cream sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function OfferCard() {
  return (
    <div className="dark-panel max-w-sm p-5">
      <div className="flex items-baseline gap-2">
        <span className="display-title text-3xl text-cream">
          {PRICE_VALUE}
        </span>
        <span className="text-sm text-cream/50">{PRICE_NOTE}</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-cream/70">
        {OFFER_INCLUDES.map((item) => (
          <li className="flex items-start gap-2" key={item}>
            <span className="mt-0.5 shrink-0 text-accent">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-16 xl:px-20">
          <Link className="flex items-center gap-3" href="/">
            <span className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
              <Image
                alt="Metodologia Silas Silva"
                className="object-contain"
                fill
                priority
                sizes="56px"
                src="/logo-mark.png"
              />
            </span>
            <span className="kicker hidden text-cream/60 sm:inline">
              Diagnóstico Estratégico de Perfil
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                className="text-xs font-semibold uppercase tracking-[0.1em] text-cream/60 transition hover:text-accent"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-cream/60 transition hover:text-accent sm:inline"
              href="/entrar"
            >
              Entrar
            </Link>
            <Link
              className="action-primary action-accent px-4 py-2.5 text-xs"
              href="/cadastro"
            >
              Analisar meu perfil
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <section className="relative overflow-hidden">
          <GlowBackground variant="hero" />
          <div className="relative grid gap-10 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            <div>
              <h1 className="display-title text-balance text-4xl leading-[1.08] text-cream sm:text-5xl">
                Descubra o que está travando seu&nbsp;Instagram.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-cream/70">
                Análise estratégica do seu perfil, com prioridades e um plano
                claro do que mudar.
              </p>
              <div className="mt-8">
                <Link className="action-primary action-accent" href="/cadastro">
                  Analisar meu perfil
                </Link>
              </div>
              <div className="mt-6">
                <OfferCard />
              </div>
            </div>

            <HeroResultPreview />
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Antes de mudar mais alguma coisa"
              title="Talvez o problema não seja postar pouco."
            />

            <div className="mt-8 grid gap-x-10 border-t border-cream/10 sm:grid-cols-2">
              {PAIN_POINTS.map((point, index) => (
                <div
                  className="flex items-center gap-4 border-b border-cream/10 py-3.5"
                  key={point}
                >
                  <span className="font-mono text-sm font-black text-accent/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-medium text-cream/80">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-base font-semibold text-cream/90">
              É isso que a análise identifica.
            </p>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24" id="o-que-voce-recebe">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading kicker="O que você recebe" title="Clareza sobre o que fazer." />

            <div className="mt-8 max-w-2xl border-t border-accent/15">
              {RECEIVE_ITEMS.map((item, index) => (
                <div
                  className="flex items-center gap-5 border-b border-accent/15 py-4"
                  key={item}
                >
                  <span className="font-mono text-base font-black text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-semibold text-cream">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="relative overflow-hidden py-16 sm:py-24">
          <GlowBackground variant="demo" />
          <div className="hairline relative" />
          <Reveal className="relative mt-10 sm:mt-14">
            <SectionHeading
              kicker="Prova, não promessa"
              title="Você não recebe apenas uma nota."
            />

            <div className="mt-8">
              <FullResultPreview />
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24" id="como-funciona">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Como funciona"
              title="Simples de enviar, profundo de receber."
            />

            <div className="relative mt-10 grid gap-8 sm:grid-cols-4">
              <div className="pointer-events-none absolute top-5 right-0 left-0 hidden h-px bg-cream/15 sm:block" />
              {HOW_IT_WORKS.map((step, index) => (
                <div className="relative flex flex-col items-start gap-3" key={step.title}>
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-ink font-mono text-sm font-black text-accent">
                    {index + 1}
                  </span>
                  <p className="text-base font-black text-cream">{step.title}</p>
                  <p className="text-sm text-cream/55">{step.hint}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24" id="dimensoes">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="8 Dimensões Estratégicas"
              title="Um perfil, vários ângulos."
            />

            <div className="mt-8 grid gap-x-10 border-t border-cream/10 sm:grid-cols-2">
              {DIMENSIONS.map((dimension, index) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-cream/10 py-3.5"
                  key={dimension.code}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-black text-cream/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base font-semibold text-cream">
                      {dimension.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-accent/60">
                    {dimension.code}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Leitura personalizada"
              title="Empresa ou criador. Pesos diferentes."
            />

            <div className="mt-8 grid overflow-hidden rounded-lg border border-cream/10 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_25px_70px_-25px_rgba(255,90,0,0.3)] sm:grid-cols-2">
              {PROFILE_TYPES.map((profile, index) => (
                <div
                  className={
                    index === 0
                      ? "border-b border-cream/10 p-6 transition-colors duration-300 hover:bg-white/[0.02] sm:border-r sm:border-b-0 sm:p-8"
                      : "p-6 transition-colors duration-300 hover:bg-white/[0.02] sm:p-8"
                  }
                  key={profile.code}
                >
                  <p className="font-mono text-xs font-black text-accent">
                    {profile.code}
                  </p>
                  <p className="mt-2.5 text-xl font-semibold text-cream">
                    {profile.title}
                  </p>
                  <p className="mt-2 text-sm font-medium text-cream/55">
                    {profile.keywords}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading
              kicker="Achismo x direção"
              title="Pare de tentar adivinhar. Comece a saber."
            />

            <div className="mt-8 overflow-hidden rounded-lg border border-cream/10">
              <div className="grid grid-cols-2 border-b border-cream/10 bg-white/[0.03]">
                <p className="kicker px-4 py-3 text-cream/45 sm:px-6">
                  Sem diagnóstico
                </p>
                <p className="kicker border-l border-cream/10 px-4 py-3 text-accent sm:px-6">
                  Com o diagnóstico
                </p>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div
                  className="grid grid-cols-2 border-b border-cream/10 last:border-b-0"
                  key={row.without}
                >
                  <p className="px-4 py-5 text-base leading-6 text-cream/50 sm:px-6">
                    {row.without}
                  </p>
                  <p className="border-l border-cream/10 px-4 py-5 text-base font-medium leading-6 text-cream/90 sm:px-6">
                    {row.with}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading kicker="Privacidade" title="Privado, do seu jeito." />

            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {TRUST_POINTS.map((point) => (
                <div key={point.title}>
                  <div className="hairline mb-4" />
                  <p className="text-base font-semibold text-cream">
                    {point.title}
                  </p>
                  <p className="mt-1.5 text-sm text-cream/55">{point.hint}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-20 text-center sm:py-32">
          <div className="hairline" />
          <Reveal className="mt-16 sm:mt-24">
            <h2 className="display-title text-2xl leading-[1.15] text-cream sm:text-4xl lg:text-5xl">
              <span className="block whitespace-nowrap">Seu perfil pode estar</span>
              <span className="block whitespace-nowrap">perdendo oportunidades.</span>
            </h2>
            <div className="mt-10">
              <Link className="action-primary action-accent" href="/cadastro">
                Analisar meu perfil
              </Link>
              <p className="mt-3 text-sm font-semibold text-accent">
                {PRICE_LABEL}
              </p>
            </div>
          </Reveal>
        </section>

        <footer className="flex flex-col items-start gap-4 border-t border-white/12 pt-8 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative h-9 w-9 shrink-0">
              <Image
                alt="Metodologia Silas Silva"
                className="object-contain"
                fill
                sizes="36px"
                src="/logo-mark.png"
              />
            </span>
            <p className="text-xs leading-5 text-cream/50">
              Metodologia Silas Silva de Diagnóstico Estratégico
            </p>
          </div>
          <Link
            className="font-mono text-xs uppercase tracking-[0.16em] text-cream/50 transition hover:text-accent"
            href="/entrar"
          >
            Área privada
          </Link>
        </footer>
      </div>
    </main>
  );
}
