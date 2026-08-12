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
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AmbientBackground, Reveal } from "./landing-motion";
import { FullResultPreview, HeroResultPreview } from "./landing-result-preview";
import { SITE_NAME, SITE_URL } from "./site-config";

const PAGE_TITLE =
  "Diagnóstico Estratégico de Perfil no Instagram | Metodologia Silas Silva";
const PAGE_DESCRIPTION =
  "Descubra o que está travando seu Instagram: score estratégico, pontos críticos com evidência e um plano de ação claro do que mudar. Diagnóstico completo por R$ 99.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

// Preco provisorio - sera atualizado quando o valor final for definido.
const PRICE_NUMBER = "99";

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
  {
    code: "POS",
    icon: Compass,
    label: "Posicionamento",
    description: "Quem você é, para quem fala e por que escolher você.",
  },
  {
    code: "IMP",
    icon: Eye,
    label: "Primeira Impressão",
    description: "O que fica claro nos primeiros segundos de visita.",
  },
  {
    code: "AUT",
    icon: BadgeCheck,
    label: "Autoridade",
    description: "Sinais de confiança, credibilidade e prova social.",
  },
  {
    code: "CON",
    icon: PenLine,
    label: "Conteúdo",
    description: "Direção, consistência e utilidade do que é publicado.",
  },
  {
    code: "IDE",
    icon: Layers,
    label: "Identidade",
    description: "Reconhecimento visual e de linguagem do perfil.",
  },
  {
    code: "CVR",
    icon: MousePointerClick,
    label: "Conversão",
    description: "Se a atenção vira próxima ação — seguir, comprar, agendar.",
  },
  {
    code: "REL",
    icon: Handshake,
    label: "Relacionamento",
    description: "Proximidade, interação e vínculo com a audiência.",
  },
  {
    code: "OPR",
    icon: Lightbulb,
    label: "Oportunidades",
    description: "Ativos e potenciais ainda pouco explorados.",
  },
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
  {
    without: "Uma IA genérica já faz isso.",
    with: "Nada é inventado — é evidência cruzada entre as dimensões.",
  },
] as const;

const TRUST_POINTS = [
  { title: "Evidências privadas", hint: "Nunca publicadas ou compartilhadas" },
  { title: "Sem inventar dado", hint: "Falta de evidência fica clara" },
  { title: "Você decide", hint: "A aplicação é sua escolha" },
] as const;

const FAQ_ITEMS = [
  {
    question: "Por que meu Instagram não converte mesmo com bom alcance?",
    answer:
      "Alcance e conversão são dimensões diferentes. Muitas vezes o problema não é quem vê o perfil, e sim o que acontece depois — bio sem proposta clara, destaques sem caminho, nenhuma chamada para ação. O diagnóstico aponta exatamente onde esse caminho quebra.",
  },
  {
    question: "Como saber se minha bio está ruim?",
    answer:
      "Uma bio funciona quando quem chega entende, em segundos, quem você é, para quem fala e o que fazer a seguir. Se falta um desses três pontos, isso aparece na leitura de Posicionamento e Conversão, com a correção específica para o seu caso.",
  },
  {
    question: "O diagnóstico funciona para perfil pequeno?",
    answer:
      "Sim. A leitura avalia posicionamento, identidade, conteúdo e os outros pontos estratégicos do perfil — não depende do número de seguidores.",
  },
  {
    question: "Preciso enviar métricas do Instagram (Insights)?",
    answer:
      "Não é obrigatório. Você envia prints do perfil como evidência; quando uma métrica não é enviada, esse ponto específico fica registrado como limitação em vez de ser inventado.",
  },
  {
    question: "Isso substitui uma consultoria completa?",
    answer:
      "Não. É um guia inicial direto — mostra o que está funcionando, o que está travando e como corrigir. Para uma consultoria contínua e aprofundada, o caminho é outro.",
  },
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
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: SITE_NAME,
    description: PAGE_DESCRIPTION,
    provider: {
      "@type": "Person",
      name: "Silas Silva",
    },
    areaServed: "BR",
    serviceType: "Consultoria de estratégia de perfil no Instagram",
    offers: {
      "@type": "Offer",
      price: PRICE_NUMBER,
      priceCurrency: "BRL",
      url: SITE_URL,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-ink text-cream">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
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
              Não mostra só o que está errado. Mostra o que mudar, por que
              mudar e como começar.
            </p>
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

            <div className="mt-8 grid border-t border-cream/10 sm:grid-cols-2">
              {PAIN_POINTS.map((point, index) => (
                <div
                  className={`flex items-center gap-4 border-b border-cream/10 py-3.5 ${
                    index % 2 === 0 ? "sm:pr-5" : "sm:pl-5"
                  }`}
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

        <section className="py-20 sm:py-28">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <div className="dark-panel flex flex-col items-center px-6 py-14 text-center sm:px-12 sm:py-20">
              <p className="kicker text-accent">A oferta</p>
              <h2 className="display-title mt-3 text-2xl leading-[1.1] text-cream sm:text-3xl">
                Isso é o que você recebe.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/60">
                Depois de ver como a leitura funciona, aqui está exatamente o
                que está incluso.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/60">
                Você não paga para saber uma nota. O score é só o ponto de
                partida — você paga para entender por que ele é esse, o que
                está causando isso e como corrigir.
              </p>
              <div className="mt-8">
                <PricingCard />
              </div>
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
                  <p className="mt-1.5 text-xs leading-4 text-cream/50">
                    {dimension.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 p-5">
              <p className="kicker text-[10px] text-accent">Leitura cruzada</p>
              <p className="mt-2 text-sm leading-6 text-cream/70">
                As 8 dimensões não são analisadas isoladamente. Um perfil com
                Identidade forte, boa Primeira Impressão e Conteúdo relevante,
                mas Conversão baixa, não tem oito notas soltas — tem um
                diagnóstico: o problema não é chamar atenção, é transformar
                essa atenção em ação.
              </p>
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
            <SectionHeading
              kicker="Sobre a metodologia"
              title="Criada por quem já viveu esse problema na prática."
            />
            <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/65">
              Silas Silva é Técnico em Marketing pelo SENAC e atua com
              estratégia de conteúdo, posicionamento digital e produção
              audiovisual.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/65">
              A metodologia surgiu da prática, analisando perfis que
              produzem conteúdo, mas nem sempre conseguem enxergar o que
              funciona, o que está limitando seus resultados e o que
              deveria mudar primeiro.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/65">
              Essa experiência foi transformada em uma leitura estruturada
              por 8 Dimensões Estratégicas, hoje potencializada por
              inteligência artificial.
            </p>
            <p className="mt-4 text-xs font-medium text-cream/40">
              Marketing · Mídias Digitais · Branding &amp; Growth ·
              Audiovisual · Fotografia
            </p>
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

        <section className="py-16 sm:py-24">
          <div className="hairline" />
          <Reveal className="mt-10 sm:mt-14">
            <SectionHeading kicker="Perguntas frequentes" title="Antes de perguntar, leia aqui." />

            <div className="mt-8 grid gap-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  className="card group rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm"
                  key={item.question}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-cream">
                    {item.question}
                    <span className="shrink-0 font-mono text-lg leading-none text-accent transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-6 text-cream/65">
                    {item.answer}
                  </p>
                </details>
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
