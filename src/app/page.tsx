import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  Handshake,
  Layers,
  Lightbulb,
  MousePointerClick,
  PenLine,
  ScanSearch,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AmbientBackground, Reveal } from "./landing-motion";
import { FullResultPreview, HeroResultPreview } from "./landing-result-preview";

// Preco provisorio - sera atualizado quando o valor final for definido.
const PRICE_NUMBER = "99";
const PRICE_LABEL = `R$ ${PRICE_NUMBER} · diagnóstico completo`;

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
  {
    icon: ClipboardList,
    title: "Conte sobre seu perfil",
    hint: "Perguntas rápidas",
  },
  { icon: Upload, title: "Envie as evidências", hint: "Prints do perfil" },
  {
    icon: ScanSearch,
    title: "Receba sua leitura",
    hint: "Análise em profundidade",
  },
  {
    icon: CheckCircle2,
    title: "Veja o que mudar",
    hint: "Diagnóstico e plano",
  },
] as const;

const DIMENSIONS = [
  { code: "POS", icon: Compass, label: "Posicionamento" },
  { code: "IMP", icon: Eye, label: "Primeira Impressão" },
  { code: "AUT", icon: BadgeCheck, label: "Autoridade" },
  { code: "CON", icon: PenLine, label: "Conteúdo" },
  { code: "IDE", icon: Layers, label: "Identidade" },
  { code: "CVR", icon: MousePointerClick, label: "Conversão" },
  { code: "REL", icon: Handshake, label: "Relacionamento" },
  { code: "OPR", icon: Lightbulb, label: "Oportunidades" },
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

function PricingCard() {
  return (
    <div className="pricing-card">
      <span className="pricing-badge">DIAGNÓSTICO COMPLETO</span>
      <div className="pricing-value">
        <span className="pricing-currency">R$</span>
        <span className="pricing-number">{PRICE_NUMBER}</span>
      </div>
      <p className="pricing-sub">pagamento único · sem assinatura</p>
      <ul className="pricing-list">
        {OFFER_INCLUDES.map((item) => (
          <li className="text-sm text-cream/75" key={item}>
            <span className="text-accent">✓</span> {item}
          </li>
        ))}
      </ul>
      <Link
        className="action-primary action-accent btn-pulse pricing-cta"
        href="/cadastro"
      >
        Analisar meu perfil
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <AmbientBackground />
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
        <section className="grid gap-10 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
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
              <p className="mt-3 text-sm text-cream/50">{PRICE_LABEL}</p>
            </div>
          </div>

          <HeroResultPreview />
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

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {RECEIVE_ITEMS.map((item, index) => (
                <div
                  className="card flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
                  key={item}
                >
                  <span className="font-mono text-base font-black text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-semibold text-cream">
                    {item}
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
              kicker="Prova, não promessa"
              title="Você não recebe apenas uma nota."
            />

            <div className="mt-8">
              <FullResultPreview />
            </div>
          </Reveal>
        </section>

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading kicker="A oferta" title="Isso é o que você recebe." />
            <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/60">
              Depois de ver como a leitura funciona, aqui está exatamente o
              que está incluso.
            </p>
            <div className="mt-8">
              <PricingCard />
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

            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, index) => (
                <div
                  className="card rounded-lg border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
                  key={step.title}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                      <step.icon aria-hidden className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-mono text-xs text-accent/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-black text-cream">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-cream/55">{step.hint}</p>
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

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIMENSIONS.map((dimension) => (
                <div
                  className="card rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur-sm"
                  key={dimension.code}
                >
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                    <dimension.icon aria-hidden className="h-[18px] w-[18px]" />
                  </span>
                  <p className="mt-3 font-mono text-[9px] font-black text-cream/30">
                    {dimension.code}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-cream">
                    {dimension.label}
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

            <div className="mt-8 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm">
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
              <PricingCard />
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
